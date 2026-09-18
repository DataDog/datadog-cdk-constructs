package main

import (
	"os"

	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v3"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type AppStackProps struct {
	awscdk.StackProps
}

// Creates a stack with a Datadog Agent daemon running on ECS Managed Instances
func NewAppStackWithDatadogManagedInstances(scope constructs.Construct, id string, props *AppStackProps) awscdk.Stack {
	// Setup stack
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	vpc := awsec2.NewVpc(stack, jsii.String("Vpc"), &awsec2.VpcProps{
		MaxAzs: jsii.Number(2),
	})

	// Plain L2 ECS cluster. The Datadog construct does not create clusters.
	cluster := awsecs.NewCluster(stack, jsii.String("Cluster"), &awsecs.ClusterProps{
		Vpc: vpc,
	})

	// The ECS infrastructure role lets ECS launch, manage, and terminate the
	// EC2 instances backing ECS Managed Instances on your behalf.
	infrastructureRole := awsiam.NewRole(stack, jsii.String("InfrastructureRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ecs.amazonaws.com"), &awsiam.ServicePrincipalOpts{}),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			// No "service-role/" path segment for this managed policy,
			// unlike most other ECS service-linked policies.
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonECSInfrastructureRolePolicyForManagedInstances")),
		},
	})

	// The EC2 instance profile role. Its name MUST start with
	// "ecsInstanceRole" - the AWS managed policy
	// AmazonECSInstanceRolePolicyForManagedInstances scopes iam:PassRole to
	// role names matching "ecsInstanceRole*". A CDK-auto-generated role name
	// will not match this pattern and ECS Managed Instances will fail to
	// launch instances.
	instanceRole := awsiam.NewRole(stack, jsii.String("InstanceRole"), &awsiam.RoleProps{
		RoleName:  jsii.String("ecsInstanceRole-example"),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), &awsiam.ServicePrincipalOpts{}),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonECSInstanceRolePolicyForManagedInstances")),
		},
	})

	instanceProfile := awsiam.NewInstanceProfile(stack, jsii.String("InstanceProfile"), &awsiam.InstanceProfileProps{
		Role: instanceRole,
	})

	managedInstancesSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("ManagedInstancesSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc: vpc,
	})

	var subnetIds []*string
	for _, subnet := range *vpc.PrivateSubnets() {
		subnetIds = append(subnetIds, subnet.SubnetId())
	}

	// ECS Managed Instances capacity provider. There is no L2 construct for
	// this resource yet, so it is defined directly at the L1 level.
	capacityProvider := awsecs.NewCfnCapacityProvider(stack, jsii.String("CapacityProvider"), &awsecs.CfnCapacityProviderProps{
		Name:        jsii.String("managed-instances-example"),
		ClusterName: cluster.ClusterName(),
		ManagedInstancesProvider: &awsecs.CfnCapacityProvider_ManagedInstancesProviderProperty{
			InfrastructureRoleArn: infrastructureRole.RoleArn(),
			InstanceLaunchTemplate: &awsecs.CfnCapacityProvider_InstanceLaunchTemplateProperty{
				Ec2InstanceProfileArn: instanceProfile.InstanceProfileArn(),
				Monitoring:            jsii.String("BASIC"),
				NetworkConfiguration: &awsecs.CfnCapacityProvider_ManagedInstancesNetworkConfigurationProperty{
					Subnets:        &subnetIds,
					SecurityGroups: &[]*string{managedInstancesSecurityGroup.SecurityGroupId()},
				},
				InstanceRequirements: &awsecs.CfnCapacityProvider_InstanceRequirementsRequestProperty{
					VCpuCount: &awsecs.CfnCapacityProvider_VCpuCountRangeRequestProperty{
						Min: jsii.Number(1),
						Max: jsii.Number(4),
					},
					MemoryMiB: &awsecs.CfnCapacityProvider_MemoryMiBRequestProperty{
						Min: jsii.Number(2048),
						Max: jsii.Number(8192),
					},
				},
			},
		},
	})

	// Set up Datadog integration
	datadog := ddcdkconstruct.NewDatadogECSManagedInstances(
		&ddcdkconstruct.DatadogECSManagedInstancesProps{
			Family:               jsii.String("datadog-agent-daemon"),
			ApiKey:               jsii.String(os.Getenv("DD_API_KEY")),
			ClusterArn:           cluster.ClusterArn(),
			CapacityProviderArns: &[]*string{awsecs.CfnCapacityProvider_ArnForCapacityProvider(capacityProvider)},
			Dogstatsd: &ddcdkconstruct.DogstatsdFeatureConfig{
				IsEnabled: jsii.Bool(true),
			},
			Apm: &ddcdkconstruct.APMFeatureConfig{
				IsEnabled: jsii.Bool(true),
			},
		},
	)
	daemon := datadog.DaemonTaskDefinition(
		stack,
		jsii.String("GoDatadogDaemon"),
		&ddcdkconstruct.DatadogECSManagedInstancesProps{},
	)

	// The Datadog Agent daemon task definition holds only the Agent
	// container. Application containers run in their own, separate task
	// definition, wired to the daemon over the shared UDS socket volume.
	// MANAGED_INSTANCES only supports "host" or "awsvpc" network mode, not
	// "bridge".
	appTaskDefinition := awsecs.NewTaskDefinition(stack, jsii.String("AppTaskDefinition"), &awsecs.TaskDefinitionProps{
		Compatibility: awsecs.Compatibility_EC2,
		NetworkMode:   awsecs.NetworkMode_HOST,
		Family:        jsii.String("sample-app"),
	})

	appEnvironment := map[string]*string{}
	if daemon.DogstatsdEnvironment() != nil {
		for _, pair := range *daemon.DogstatsdEnvironment() {
			appEnvironment[*pair.Name] = pair.Value
		}
	}
	if daemon.ApmEnvironment() != nil {
		for _, pair := range *daemon.ApmEnvironment() {
			appEnvironment[*pair.Name] = pair.Value
		}
	}

	appContainer := appTaskDefinition.AddContainer(
		jsii.String("DogstatsdApp"),
		&awsecs.ContainerDefinitionOptions{
			ContainerName: jsii.String("datadog-dogstatsd-app"),
			Image: awsecs.ContainerImage_FromRegistry(
				jsii.String("ghcr.io/datadog/apps-dogstatsd:main"),
				&awsecs.RepositoryImageProps{},
			),
			Essential:      jsii.Bool(true),
			MemoryLimitMiB: jsii.Number(256),
			Environment:    &appEnvironment,
		},
	)

	if daemon.AppDdSocketsVolume() != nil && daemon.AppDdSocketsMountPoint() != nil {
		volume := daemon.AppDdSocketsVolume()
		mountPoint := daemon.AppDdSocketsMountPoint()

		var sourcePath *string
		if volume.Host != nil {
			sourcePath = volume.Host.SourcePath
		}

		appTaskDefinition.AddVolume(&awsecs.Volume{
			Name: volume.Name,
			Host: &awsecs.Host{
				SourcePath: sourcePath,
			},
		})
		appContainer.AddMountPoints(&awsecs.MountPoint{
			SourceVolume:  mountPoint.SourceVolume,
			ContainerPath: mountPoint.ContainerPath,
			ReadOnly:      jsii.Bool(true),
		})
	}

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewAppStackWithDatadogManagedInstances(app, "CdkGoManagedInstancesStack", &AppStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is to
// be deployed. For more information see: https://docs.aws.amazon.com/cdk/latest/guide/environments.html
func env() *awscdk.Environment {
	env := awscdk.Environment{
		Account: jsii.String("376334461865"),
		Region:  jsii.String("us-east-1"),
	}
	return &env
}
