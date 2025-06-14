const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Determine output directory
let outdir = '../simon'; // Default output directory
const outdirArgIndex = process.argv.indexOf('--outdir');
if (outdirArgIndex > -1 && process.argv[outdirArgIndex + 1]) {
    outdir = process.argv[outdirArgIndex + 1];
}

// Ensure output directory exists
const outdirPath = path.resolve(__dirname, outdir); // Use absolute path for reliability
if (!fs.existsSync(outdirPath)) {
    fs.mkdirSync(outdirPath, { recursive: true }); // Use recursive true for nested paths
}

// Build configuration
const buildConfig = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: path.join(outdirPath, 'bundle.js'), // Use path.join for cross-platform compatibility
    platform: 'browser',
    target: 'es2017',
    format: 'iife',
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
    external: [],
    globalName: 'SimonGame',
    define: {
        'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`
    }
};

function copyStaticFiles(targetDir) {
    const filesToCopy = [
        { src: 'index.html', dest: path.join(targetDir, 'index.html') },
        { src: 'styles', dest: path.join(targetDir, 'styles') }
    ];

    for (const file of filesToCopy) {
        if (fs.existsSync(file.src)) {
            const destDir = path.dirname(file.dest);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            if (fs.statSync(file.src).isDirectory()) {
                // Copy directory
                if (!fs.existsSync(file.dest)) {
                    fs.mkdirSync(file.dest, { recursive: true });
                }
                const items = fs.readdirSync(file.src);
                for (const item of items) {
                    fs.copyFileSync(
                        path.join(file.src, item),
                        path.join(file.dest, item)
                    );
                }
            } else {
                // Copy file
                fs.copyFileSync(file.src, file.dest);
            }
            console.log(`📋 Copied ${file.src} to ${file.dest}`);
        }
    }
}

async function build() {
    try {
        console.log('Building Simon Says game...');
        
        await esbuild.build(buildConfig);
        
        console.log('✅ Build completed successfully!');
        console.log(`📦 Bundle created at: ${buildConfig.outfile}`);
        
        copyStaticFiles(outdirPath);
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1); // Ensure exit code is an integer
    }
}

// Watch mode for development
if (process.argv.includes('--watch')) {
    (async () => {
        try {
            const ctx = await esbuild.context({
                ...buildConfig, // buildConfig is now correctly using the outdirPath for ../simon by default
                plugins: [{
                    name: 'rebuild-logger',
                    setup(build) {
                        let firstBuild = true;
                        build.onEnd(result => {
                            if (result.errors.length > 0) {
                                console.error('❌ Rebuild failed:');
                                return;
                            }

                            if (firstBuild) {
                                console.log(`📦 Initial bundle created at: ${buildConfig.outfile}`);
                                copyStaticFiles(outdirPath);
                                console.log('👁️ Watching for changes...');
                                firstBuild = false;
                            } else {
                                console.log('✅ Rebuild completed');
                            }
                        });
                    }
                }]
            });
            await ctx.watch();
        } catch (error) {
            console.error('❌ Watch setup failed:', error);
            process.exit(1);
        }
    })();
} else {
    // For non-watch mode, ensure the script exits after build.
    // The previous timeout issue suggests esbuild might keep the event loop alive.
    build()
        .then(() => {
            console.log('Build process finished from .then().');
            process.exit(0);
        })
        .catch(e => {
            console.error('Build process failed from .catch():', e);
            process.exit(1);
        });
}
