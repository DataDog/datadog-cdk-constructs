package ddcdkconstruct


type RuntimeType string

const (
	RuntimeType_DOTNET RuntimeType = "DOTNET"
	RuntimeType_NODE RuntimeType = "NODE"
	RuntimeType_PYTHON RuntimeType = "PYTHON"
	RuntimeType_JAVA RuntimeType = "JAVA"
	RuntimeType_CUSTOM RuntimeType = "CUSTOM"
	RuntimeType_UNSUPPORTED RuntimeType = "UNSUPPORTED"
)

