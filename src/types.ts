export type StyleModuleMapType = Record<string, string>;
export type StyleModuleImportMapType = Record<string, StyleModuleMapType>;
export type GenerateScopedNameType = (localName: string, resourcePath: string) => string;
export type GenerateScopedNameConfigurationType = GenerateScopedNameType | string;
export type HandleMissingStyleNameOptionType = "throw" | "warn" | "ignore";
export type GetClassNameOptionsType = {
  handleMissingStyleName: HandleMissingStyleNameOptionType;
  autoResolveMultipleImports: boolean;
};
