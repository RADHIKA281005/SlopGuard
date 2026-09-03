import { checkNpmPackage } from "./registry.js";

async function test() {
    console.log(await checkNpmPackage("lodash"));

    console.log(await checkNpmPackage("this-package-definitely-does-not-exist-xyz-123"));
}

test();