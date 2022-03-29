import { dirname, resolve } from "path";
import { readFileSync } from "fs";
import sass from "sass";
import postcss from "postcss";
import genericNames from "generic-names";
import ExtractImports from "postcss-modules-extract-imports";
import LocalByDefault from "postcss-modules-local-by-default";
import Parser from "postcss-modules-parser";
import Scope from "postcss-modules-scope";
import Values from "postcss-modules-values";
import type { GenerateScopedNameConfigurationType, StyleModuleMapType } from "./types";
import optionsDefaults from "./schemas/optionsDefaults";
type FiletypeOptionsType = {
  readonly syntax: string;
  readonly plugins?: ReadonlyArray<string | ReadonlyArray<[string, unknown]>>;
};
type FiletypesConfigurationType = Record<string, FiletypeOptionsType>;
type OptionsType = {
  context?: string;
  filetypes: FiletypesConfigurationType;
  generateScopedName?: GenerateScopedNameConfigurationType;
  includePaths?: ReadonlyArray<string>;
};

const getFiletypeOptions = (cssSourceFilePath: string, filetypes: FiletypesConfigurationType): FiletypeOptionsType | null | undefined => {
  const extension = cssSourceFilePath.substr(cssSourceFilePath.lastIndexOf('.'));
  const filetype = filetypes ? filetypes[extension] : null;
  return filetype;
};

// eslint-disable-next-line flowtype/no-weak-types
const getSyntax = (filetypeOptions: FiletypeOptionsType): (((...args: Array<any>) => any) | Record<string, any>) | null | undefined => {
  if (!filetypeOptions || !filetypeOptions.syntax) {
    return null;
  }

  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(filetypeOptions.syntax);
};

// eslint-disable-next-line flowtype/no-weak-types
const getExtraPlugins = (filetypeOptions: FiletypeOptionsType | null | undefined): ReadonlyArray<any> => {
  if (!filetypeOptions || !filetypeOptions.plugins) {
    return [];
  }

  return filetypeOptions.plugins.map(plugin => {
    if (Array.isArray(plugin)) {
      const [pluginName, pluginOptions] = plugin;
      // eslint-disable-next-line import/no-dynamic-require, global-require
      return require(pluginName)(pluginOptions);
    }

    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(plugin as string);
  });
};

const getTokens = (runner, cssSourceFilePath: string, filetypeOptions: FiletypeOptionsType | null | undefined, includePaths?: ReadonlyArray<string>): StyleModuleMapType => {
  const extension = cssSourceFilePath.substr(cssSourceFilePath.lastIndexOf('.'));
  // eslint-disable-next-line flowtype/no-weak-types
  const options: Record<string, any> = {
    from: cssSourceFilePath
  };

  if (filetypeOptions) {
    options.syntax = getSyntax(filetypeOptions);
  }

  let fileContents;

  if (extension === '.scss') {
    fileContents = sass.renderSync({
      file: cssSourceFilePath,
      includePaths: includePaths as string[]
    });
    fileContents = fileContents.css.toString();
  } else {
    fileContents = readFileSync(cssSourceFilePath, 'utf-8');
  }

  const lazyResult = runner.process(fileContents, options);
  lazyResult.warnings().forEach(message => {
    // eslint-disable-next-line no-console
    console.warn(message.text);
  });
  return lazyResult.root.tokens;
};

export default ((cssSourceFilePath: string, options: OptionsType): StyleModuleMapType => {
  // eslint-disable-next-line prefer-const
  let runner;
  let generateScopedName;

  if (options.generateScopedName && typeof options.generateScopedName === 'function') {
    generateScopedName = options.generateScopedName;
  } else {
    generateScopedName = genericNames((options.generateScopedName || optionsDefaults.generateScopedName) as string, {
      context: options.context || process.cwd()
    });
  }

  const filetypeOptions = getFiletypeOptions(cssSourceFilePath, options.filetypes);

  const fetch = (to: string, from: string) => {
    const fromDirectoryPath = dirname(from);
    const toPath = resolve(fromDirectoryPath, to);
    return getTokens(runner, toPath, filetypeOptions, options.includePaths);
  };

  const extraPlugins = getExtraPlugins(filetypeOptions);
  const plugins = [...extraPlugins, Values, LocalByDefault, ExtractImports, Scope({
    generateScopedName
  }), new Parser({
    fetch
  })];
  runner = postcss(plugins);
  return getTokens(runner, cssSourceFilePath, filetypeOptions, options.includePaths);
});
