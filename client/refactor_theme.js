import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'src');

const replacements = [
    { regex: /bg-\[\#0F111A\]/g, replacement: 'bg-slate-50 dark:bg-[#0F111A]' },
    { regex: /bg-\[\#161925\]/g, replacement: 'bg-white dark:bg-[#161925]' },
    { regex: /border-\[\#1E202C\]/g, replacement: 'border-slate-200 dark:border-[#1E202C]' },
    { regex: /bg-\[\#1E202C\]/g, replacement: 'bg-slate-200 dark:bg-[#1E202C]' },
    { regex: /text-white/g, replacement: 'text-slate-900 dark:text-white' },
    { regex: /text-slate-300/g, replacement: 'text-slate-700 dark:text-slate-300' },
    { regex: /text-slate-400/g, replacement: 'text-slate-500 dark:text-slate-400' },
    { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-slate-100 dark:hover:bg-white/5' },
    { regex: /bg-white\/5/g, replacement: 'bg-slate-100 dark:bg-white/5' },
    { regex: /text-slate-200/g, replacement: 'text-slate-800 dark:text-slate-200' },
    { regex: /border-slate-800/g, replacement: 'border-slate-200 dark:border-slate-800' }
];

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            replacements.forEach(({ regex, replacement }) => {
                if (regex.test(content)) {
                    content = content.replace(regex, replacement);
                    modified = true;
                }
            });

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

walkDir(directoryPath);
console.log('Refactoring complete.');
