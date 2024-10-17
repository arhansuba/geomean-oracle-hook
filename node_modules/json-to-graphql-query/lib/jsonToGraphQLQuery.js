"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonToGraphQLQuery = exports.configFields = void 0;
var EnumType_1 = require("./types/EnumType");
var VariableType_1 = require("./types/VariableType");
exports.configFields = [
    '__args',
    '__alias',
    '__aliasFor',
    '__variables',
    '__directives',
    '__on',
    '__all_on',
    '__typeName',
    '__name',
];
function stringify(obj_from_json) {
    if (obj_from_json instanceof EnumType_1.EnumType) {
        return obj_from_json.value;
    }
    else if (obj_from_json instanceof VariableType_1.VariableType) {
        return "$".concat(obj_from_json.value);
    }
    else if (typeof obj_from_json !== 'object' || obj_from_json === null) {
        return JSON.stringify(obj_from_json);
    }
    else if (Array.isArray(obj_from_json)) {
        return "[".concat(obj_from_json.map(function (item) { return stringify(item); }).join(', '), "]");
    }
    var props = Object.keys(obj_from_json)
        .map(function (key) { return "".concat(key, ": ").concat(stringify(obj_from_json[key])); })
        .join(', ');
    return "{".concat(props, "}");
}
function buildArgs(argsObj) {
    var args = [];
    for (var argName in argsObj) {
        args.push("".concat(argName, ": ").concat(stringify(argsObj[argName])));
    }
    return args.join(', ');
}
function buildVariables(varsObj) {
    var args = [];
    for (var varName in varsObj) {
        args.push("$".concat(varName, ": ").concat(varsObj[varName]));
    }
    return args.join(', ');
}
function buildDirectives(dirsObj) {
    var directiveName = Object.keys(dirsObj)[0];
    var directiveValue = dirsObj[directiveName];
    if (typeof directiveValue === 'boolean' ||
        (typeof directiveValue === 'object' &&
            Object.keys(directiveValue).length === 0)) {
        return directiveName;
    }
    else if (typeof directiveValue === 'object') {
        var args = [];
        for (var argName in directiveValue) {
            var argVal = stringify(directiveValue[argName]).replace(/"/g, '');
            args.push("".concat(argName, ": ").concat(argVal));
        }
        return "".concat(directiveName, "(").concat(args.join(', '), ")");
    }
    else {
        throw new Error("Unsupported type for directive: ".concat(typeof directiveValue, ". Types allowed: object, boolean.\n") +
            "Offending object: ".concat(JSON.stringify(dirsObj)));
    }
}
function getIndent(level) {
    return Array(level * 4 + 1).join(' ');
}
function filterNonConfigFields(fieldName, ignoreFields) {
    return (exports.configFields.indexOf(fieldName) == -1 &&
        ignoreFields.indexOf(fieldName) == -1);
}
function convertQuery(node, level, output, options) {
    Object.keys(node)
        .filter(function (key) { return filterNonConfigFields(key, options.ignoreFields); })
        .forEach(function (key) {
        var value = node[key];
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                value = value.find(function (item) { return item && typeof item === 'object'; });
                if (!value) {
                    output.push(["".concat(key), level]);
                    return;
                }
            }
            if (value &&
                Object.keys(value).filter(function (k) { return value[k] !== false || options.includeFalsyKeys; }).length === 0) {
                return;
            }
            var fieldCount = Object.keys(value).filter(function (keyCount) {
                return filterNonConfigFields(keyCount, options.ignoreFields);
            }).length;
            var subFields = fieldCount > 0;
            var argsExist = typeof value.__args === 'object' &&
                Object.keys(value.__args).length > 0;
            var directivesExist = typeof value.__directives === 'object';
            var fullFragmentsExist = value.__all_on instanceof Array;
            var partialFragmentsExist = typeof value.__on === 'object';
            var token = "".concat(key);
            if (typeof value.__name === 'string') {
                token = "".concat(token, " ").concat(value.__name);
            }
            if (typeof value.__aliasFor === 'string') {
                token = "".concat(token, ": ").concat(value.__aliasFor);
            }
            if (typeof value.__variables === 'object' &&
                Object.keys(value.__variables).length > 0) {
                token = "".concat(token, " (").concat(buildVariables(value.__variables), ")");
            }
            else if (argsExist || directivesExist) {
                var argsStr = '';
                var dirsStr = '';
                if (directivesExist) {
                    dirsStr = Object.entries(value.__directives)
                        .map(function (item) {
                        var _a;
                        return "@".concat(buildDirectives((_a = {}, _a[item[0]] = item[1], _a)));
                    })
                        .join(' ');
                }
                if (argsExist) {
                    argsStr = "(".concat(buildArgs(value.__args), ")");
                }
                var spacer = directivesExist && argsExist ? ' ' : '';
                token = "".concat(token, " ").concat(argsStr).concat(spacer).concat(dirsStr);
            }
            output.push([
                token +
                    (subFields ||
                        partialFragmentsExist ||
                        fullFragmentsExist
                        ? ' {'
                        : ''),
                level,
            ]);
            convertQuery(value, level + 1, output, options);
            if (fullFragmentsExist) {
                value.__all_on.forEach(function (fullFragment) {
                    output.push(["...".concat(fullFragment), level + 1]);
                });
            }
            if (partialFragmentsExist) {
                var inlineFragments = value.__on instanceof Array ? value.__on : [value.__on];
                inlineFragments.forEach(function (inlineFragment) {
                    var name = inlineFragment.__typeName;
                    output.push(["... on ".concat(name, " {"), level + 1]);
                    convertQuery(inlineFragment, level + 2, output, options);
                    output.push(['}', level + 1]);
                });
            }
            if (subFields || partialFragmentsExist || fullFragmentsExist) {
                output.push(['}', level]);
            }
        }
        else if (options.includeFalsyKeys === true || value) {
            output.push(["".concat(key), level]);
        }
    });
}
function jsonToGraphQLQuery(query, options) {
    if (options === void 0) { options = {}; }
    if (!query || typeof query != 'object') {
        throw new Error('query object not specified');
    }
    if (Object.keys(query).length == 0) {
        throw new Error('query object has no data');
    }
    if (!(options.ignoreFields instanceof Array)) {
        options.ignoreFields = [];
    }
    var queryLines = [];
    convertQuery(query, 0, queryLines, options);
    queryLines = dropEmptyObjects(queryLines);
    var output = '';
    queryLines.forEach(function (_a) {
        var line = _a[0], level = _a[1];
        if (options.pretty) {
            if (output) {
                output += '\n';
            }
            output += getIndent(level) + line;
        }
        else {
            if (output) {
                output += ' ';
            }
            output += line;
        }
    });
    return output;
}
exports.jsonToGraphQLQuery = jsonToGraphQLQuery;
function dropEmptyObjects(inputList) {
    var rootContext = {
        indent: -1,
        text: null,
        isEmpty: true,
        contents: [],
    };
    var stack = [rootContext];
    for (var _i = 0, inputList_1 = inputList; _i < inputList_1.length; _i++) {
        var _a = inputList_1[_i], text = _a[0], indent = _a[1];
        text = text.trim();
        if (text.endsWith('{')) {
            var context_1 = {
                indent: indent,
                text: text,
                isEmpty: true,
                contents: [],
            };
            stack[stack.length - 1].contents.push(context_1);
            stack.push(context_1);
        }
        else if (text === '}') {
            var context_2 = stack.pop();
            if (context_2.isEmpty) {
                stack[stack.length - 1].contents.pop();
            }
            else {
                stack[stack.length - 1].isEmpty = false;
            }
        }
        else {
            stack[stack.length - 1].contents.push(text);
            stack[stack.length - 1].isEmpty = false;
        }
    }
    var output = [];
    function traverse(context) {
        for (var _i = 0, _a = context.contents; _i < _a.length; _i++) {
            var item = _a[_i];
            if (typeof item === 'object') {
                output.push([item.text, item.indent]);
                traverse(item);
                output.push(['}', item.indent]);
            }
            else {
                output.push([item, context.indent + 1]);
            }
        }
    }
    traverse(rootContext);
    return output;
}
//# sourceMappingURL=jsonToGraphQLQuery.js.map