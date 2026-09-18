from constructs import Construct
from datadog_cdk_constructs_v2 import DatadogECSManagedInstances
from aws_cdk import Stack
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_ecs as ecs
from aws_cdk import aws_iam as iam
import os

class CdkPythonStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        vpc = ec2.Vpc(self, "Vpc", max_azs=2)

        # Plain L2 ECS cluster. The Datadog construct does not create clusters.
        cluster = ecs.Cluster(self, "Cluster", vpc=vpc)

        # The ECS infrastructure role lets ECS launch, manage, and terminate
        # the EC2 instances backing ECS Managed Instances on your behalf.
        infrastructure_role = iam.Role(
            self,
            "InfrastructureRole",
            assumed_by=iam.ServicePrincipal("ecs.amazonaws.com"),
            managed_policies=[
                # No "service-role/" path segment for this managed policy,
                # unlike most other ECS service-linked policies.
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonECSInfrastructureRolePolicyForManagedInstances"
                ),
            ],
        )

        # The EC2 instance profile role. Its name MUST start with
        # "ecsInstanceRole" - the AWS managed policy
        # AmazonECSInstanceRolePolicyForManagedInstances scopes iam:PassRole
        # to role names matching "ecsInstanceRole*". A CDK-auto-generated
        # role name will not match this pattern and ECS Managed Instances
        # will fail to launch instances.
        instance_role = iam.Role(
            self,
            "InstanceRole",
            role_name="ecsInstanceRole-example",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonECSInstanceRolePolicyForManagedInstances"
                ),
            ],
        )

        instance_profile = iam.InstanceProfile(self, "InstanceProfile", role=instance_role)

        managed_instances_security_group = ec2.SecurityGroup(self, "ManagedInstancesSecurityGroup", vpc=vpc)

        # ECS Managed Instances capacity provider. There is no L2 construct
        # for this resource yet, so it is defined directly at the L1 level.
        capacity_provider = ecs.CfnCapacityProvider(
            self,
            "CapacityProvider",
            name="managed-instances-example",
            cluster_name=cluster.cluster_name,
            managed_instances_provider=ecs.CfnCapacityProvider.ManagedInstancesProviderProperty(
                infrastructure_role_arn=infrastructure_role.role_arn,
                instance_launch_template=ecs.CfnCapacityProvider.InstanceLaunchTemplateProperty(
                    ec2_instance_profile_arn=instance_profile.instance_profile_arn,
                    monitoring="BASIC",
                    network_configuration=ecs.CfnCapacityProvider.ManagedInstancesNetworkConfigurationProperty(
                        subnets=[subnet.subnet_id for subnet in vpc.private_subnets],
                        security_groups=[managed_instances_security_group.security_group_id],
                    ),
                    instance_requirements=ecs.CfnCapacityProvider.InstanceRequirementsRequestProperty(
                        v_cpu_count=ecs.CfnCapacityProvider.VCpuCountRangeRequestProperty(min=1, max=4),
                        memory_mi_b=ecs.CfnCapacityProvider.MemoryMiBRequestProperty(min=2048, max=8192),
                    ),
                ),
            ),
        )

        ecs_datadog = DatadogECSManagedInstances(
            family="datadog-agent-daemon",
            api_key=os.getenv("DD_API_KEY"),
            cluster_arn=cluster.cluster_arn,
            capacity_provider_arns=[
                ecs.CfnCapacityProvider.arn_for_capacity_provider(capacity_provider)
            ],
            dogstatsd={"is_enabled": True},
            apm={"is_enabled": True},
            global_tags="owner:datadog, team:contp",
        )

        daemon = ecs_datadog.daemon_task_definition(self, "PythonDatadogDaemon")

        # The Datadog Agent daemon task definition holds only the Agent
        # container. Application containers run in their own, separate task
        # definition, wired to the daemon over the shared UDS socket volume.
        # MANAGED_INSTANCES only supports "host" or "awsvpc" network mode,
        # not "bridge".
        app_task_definition = ecs.TaskDefinition(
            self,
            "AppTaskDefinition",
            compatibility=ecs.Compatibility.EC2,
            network_mode=ecs.NetworkMode.HOST,
            family="sample-app",
        )

        app_container = app_task_definition.add_container(
            "DogstatsdApp",
            container_name="datadog-dogstatsd-app",
            image=ecs.ContainerImage.from_registry("ghcr.io/datadog/apps-dogstatsd:main"),
            essential=True,
            memory_limit_mib=256,
            environment={
                **{pair.name: pair.value for pair in daemon.dogstatsd_environment},
                **{pair.name: pair.value for pair in daemon.apm_environment},
            },
        )

        if daemon.app_dd_sockets_volume and daemon.app_dd_sockets_mount_point:
            app_task_definition.add_volume(
                name=daemon.app_dd_sockets_volume.name,
                host=ecs.Host(source_path=daemon.app_dd_sockets_volume.host.source_path),
            )
            app_container.add_mount_points(
                ecs.MountPoint(
                    source_volume=daemon.app_dd_sockets_mount_point.source_volume,
                    container_path=daemon.app_dd_sockets_mount_point.container_path,
                    read_only=True,
                )
            )
