import {File} from "fuse-box/dist/typings/core/File";
import {Plugin, WorkFlowContext} from "fuse-box/dist/typings/core/WorkflowContext";

let flowRemoveTypes;

export class FlowPluginClass implements Plugin {
    public test: RegExp = /\.js(x)?$/;
    private limit2project: boolean;

    constructor({limit2project = true}: { limit2project?: boolean } = {}) {
        this.limit2project = limit2project;
    }

    public init(context: WorkFlowContext) {
        context.allowExtension(".jsx");
    }

    public transform(file: File) {
        const context = file.context;
        if (context.useCache) {
            let cached = context.cache.getStaticCache(file);
            if (cached) {
                if (cached.sourceMap) {
                    file.sourceMap = cached.sourceMap;
                }
                file.analysis.skip();
                file.analysis.dependencies = cached.dependencies;
                file.contents = cached.contents;
                return;
            }
        }

        if (!this.limit2project || file.collection.name === file.context.defaultPackageName) {
            if (!flowRemoveTypes) {
                flowRemoveTypes = require('flow-remove-types');
            }

            file.contents = flowRemoveTypes(file.contents).toString();

            if (context.useCache) {
                context.emitJavascriptHotReload(file);
                context.cache.writeStaticCache(file, file.sourceMap);
            }
        }
    }
}

export const FlowPlugin = (opts: any) => new FlowPluginClass(opts);
