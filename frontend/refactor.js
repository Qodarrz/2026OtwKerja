const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
    // Primary Colors
    { regex: /\bhover:bg-(indigo|blue|sky)-[567]00\b/g, replacement: 'hover:bg-primary/90' },
    { regex: /\bbg-(indigo|blue|sky)-[567]00\b/g, replacement: 'bg-primary' },
    { regex: /\bhover:text-(indigo|blue|sky)-[567]00\b/g, replacement: 'hover:text-primary' },
    { regex: /\btext-(indigo|blue|sky)-[567]00\b/g, replacement: 'text-primary' },
    { regex: /\bborder-(indigo|blue|sky)-[567]00\b/g, replacement: 'border-primary' },
    { regex: /\bhover:border-(indigo|blue|sky)-[567]00\b/g, replacement: 'hover:border-primary' },
    { regex: /\bring-(indigo|blue|sky)-[567]00\b/g, replacement: 'ring-primary' },
    { regex: /\bfocus:ring-(indigo|blue|sky)-[567]00\b/g, replacement: 'focus:ring-primary' },

    // Backgrounds & Surfaces
    { regex: /\bbg-white\b/g, replacement: 'bg-card' },
    { regex: /\bhover:bg-gray-50\b/g, replacement: 'hover:bg-accent' },
    { regex: /\bhover:bg-slate-50\b/g, replacement: 'hover:bg-accent' },
    { regex: /\bbg-(gray|slate|zinc)-50\b/g, replacement: 'bg-muted' },
    { regex: /\bbg-(gray|slate|zinc)-100\b/g, replacement: 'bg-secondary' },
    { regex: /\bbg-(gray|slate|zinc)-800\b/g, replacement: 'bg-muted' },
    { regex: /\bbg-(gray|slate|zinc)-900\b/g, replacement: 'bg-background' },
    { regex: /\bhover:bg-(gray|slate|zinc)-100\b/g, replacement: 'hover:bg-secondary' },
    { regex: /\bhover:bg-(gray|slate|zinc)-200\b/g, replacement: 'hover:bg-accent' },
    { regex: /\bbg-black\b/g, replacement: 'bg-foreground' },

    // Text Colors
    { regex: /\btext-white\b/g, replacement: 'text-primary-foreground' },
    { regex: /\btext-(gray|slate|zinc)-[456]00\b/g, replacement: 'text-muted-foreground' },
    { regex: /\bhover:text-(gray|slate|zinc)-[456]00\b/g, replacement: 'hover:text-muted-foreground' },
    { regex: /\btext-(gray|slate|zinc)-[89]00\b/g, replacement: 'text-foreground' },
    { regex: /\bhover:text-(gray|slate|zinc)-[89]00\b/g, replacement: 'hover:text-foreground' },

    // Border Colors
    { regex: /\bborder-(gray|slate|zinc)-[12]00\b/g, replacement: 'border-border' },
    { regex: /\bborder-(gray|slate|zinc)-300\b/g, replacement: 'border-input' },
    { regex: /\bborder-(gray|slate|zinc)-800\b/g, replacement: 'border-border' },
    { regex: /\bhover:border-(gray|slate|zinc)-[34]00\b/g, replacement: 'hover:border-border' },

    // Removing glowing shadows and standardizing
    { regex: /\bshadow-xl\b/g, replacement: 'shadow-md' },
    { regex: /\bshadow-2xl\b/g, replacement: 'shadow-lg' },
    { regex: /\bshadow-(indigo|blue|sky|primary)\/[0-9]+\b/g, replacement: 'shadow-sm' },
    { regex: /\bshadow-[a-z]+-[0-9]+\/[0-9]+\b/g, replacement: 'shadow-sm' },
    { regex: /\bshadow-[a-z]+-[0-9]+\b/g, replacement: 'shadow-sm' }, // e.g. shadow-indigo-100
    { regex: /\bdrop-shadow-(xl|2xl|lg|md)\b/g, replacement: 'drop-shadow-sm' },
    { regex: /\bdrop-shadow-\[.*?\]\b/g, replacement: '' },
    { regex: /\bshadow-\[.*?\]\b/g, replacement: '' },

    // Gradients & Effects
    { regex: /\bgradient-text\b/g, replacement: 'text-primary' },
    { regex: /\bgradient-border\b/g, replacement: '' },
    { regex: /\bbg-gradient-to-[a-z]+ from-[a-z]+-[0-9]+ (via-[a-z]+-[0-9]+ )?to-[a-z]+-[0-9]+\b/g, replacement: 'bg-primary text-primary-foreground' },
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            for (const { regex, replacement } of replacements) {
                content = content.replace(regex, replacement);
            }

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory(srcDir);
console.log('Refactoring complete.');
