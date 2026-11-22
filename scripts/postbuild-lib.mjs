// Post-build step for the published library (dist/ngx-mask-lib):
// 1. copy the docs, 2. guard that the bundle really needs no tslib,
// 3. drop a leftover `tslib` dependency and an empty `dependencies` block.
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist/ngx-mask-lib');

for (const file of ['README.md', 'LICENSE', 'llms.txt', 'llms-full.txt']) {
    copyFileSync(join(root, file), join(dist, file));
}

const bundleDir = join(dist, 'fesm2022');
const tslibImport = /(?:from|import)\s*['"]tslib['"]|require\(['"]tslib['"]\)/;
const offenders = readdirSync(bundleDir)
    .filter((name) => name.endsWith('.mjs'))
    .filter((name) => tslibImport.test(readFileSync(join(bundleDir, name), 'utf8')));
if (offenders.length > 0) {
    console.error(
        `postbuild-lib: ${offenders.join(', ')} import tslib; it cannot be dropped from dependencies.`
    );
    process.exit(1);
}

const pkgPath = join(dist, 'package.json');
if (!existsSync(pkgPath)) {
    console.error(`postbuild-lib: ${pkgPath} not found.`);
    process.exit(1);
}
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
if (pkg.dependencies) {
    delete pkg.dependencies.tslib;
    if (Object.keys(pkg.dependencies).length === 0) {
        delete pkg.dependencies;
    }
}
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`);
