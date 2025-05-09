const jestConfig = {
  preset: "ts-jest/presets/default-esm",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          target: "es2017",
          module: "es2022",
          moduleResolution: "node",
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          baseUrl: "src",
          outDir: "dist",
          declaration: true,
          emitDeclarationOnly: true,
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          allowUnusedLabels: false,
          allowUnreachableCode: false,
          exactOptionalPropertyTypes: true,
          noFallthroughCasesInSwitch: true,
          noImplicitAny: true,
          noImplicitOverride: true,
          noImplicitReturns: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          verbatimModuleSyntax: false,
          allowJs: false,
          allowImportingTsExtensions: false,
          resolveJsonModule: true,
        },
        useESM: true,
      },
    ],
  },
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};

export default jestConfig;
