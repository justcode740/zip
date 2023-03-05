export interface ContractInfos {
    status:  string;
    message: string;
    result:  Result[];
}

export interface Result {
    SourceCode:           string;
    ABI:                  string;
    ContractName:         string;
    CompilerVersion:      string;
    OptimizationUsed:     string;
    Runs:                 string;
    ConstructorArguments: string;
    EVMVersion:           string;
    Library:              string;
    LicenseType:          string;
    Proxy:                string;
    Implementation:       string;
    SwarmSource:          string;
}