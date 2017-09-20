import * as uriTemplates from "uri-templates";

export class URI {
    public uriTemplates;

    constructor(public uri: string, public templated: boolean = false, public realURI = "") {
        if (templated) {
            this.uriTemplates = uriTemplates(uri);
        }
    }

    public fill(params: object = {}): string {
        if (this.templated && this.uriTemplates) {
            return this.uriTemplates.fill(params);
        } else {
            return this.uri;
        }
    }
}
