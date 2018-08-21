// @flow

import BabelTypes, {
  ObjectExpression
} from '@babel/types';

type InputObjectType = {
  [key: string]: *
};

/**
 * Creates an AST representation of an InputObjectType shape object.
 */
const createObjectExpression = (type: BabelTypes, object: InputObjectType): ObjectExpression => {
  const properties = [];

  for (const name of Object.keys(object)) {
    const value = object[name];

    let newValue;

    // eslint-disable-next-line no-empty
    if (type.isAnyTypeAnnotation(value)) {

    } else if (typeof value === 'string') {
      newValue = type.stringLiteral(value);
    } else if (typeof value === 'object') {
      newValue = createObjectExpression(type, value);
    } else if (typeof value === 'boolean') {
      newValue = t.booleanLiteral(value);
    } else if (typeof value === 'undefined') {
      // eslint-disable-next-line no-continue
      continue;
    } else {
      throw new TypeError('Unexpected type: ' + typeof value);
    }

    properties.push(
      type.objectProperty(
        type.stringLiteral(name),
        newValue
      )
    );
  }

  return type.objectExpression(properties);
};

export default createObjectExpression;
