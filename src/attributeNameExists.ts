import optionsDefaults from "./schemas/optionsDefaults";

const attributeNameExists = (programPath: any, stats: any): boolean => {
  let exists = false;
  let attributeNames = optionsDefaults.attributeNames;

  if (stats.opts && stats.opts.attributeNames) {
    attributeNames = Object.assign({}, attributeNames, stats.opts.attributeNames);
  }

  programPath.traverse({
    JSXAttribute(attrPath: any) {
      if (exists) {
        return;
      }

      const attribute = attrPath.node;

      if (typeof attribute.name !== 'undefined' && typeof attributeNames[attribute.name.name] === 'string') {
        exists = true;
      }
    }

  });
  return exists;
};

export default attributeNameExists;
