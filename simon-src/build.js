const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Build configuration
const buildConfig = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: 'dist/bundle.js',
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

async function build() {
    try {
        console.log('Building Simon Says game...');
        
        await esbuild.build(buildConfig);
        
        console.log('✅ Build completed successfully!');
        console.log(`📦 Bundle created at: ${buildConfig.outfile}`);
        
        // Copy additional files if needed
        const filesToCopy = [
            { src: 'index.html', dest: 'dist/index.html' },
            { src: 'styles', dest: 'dist/styles' }
        ];
        
        for (const file of filesToCopy) {
            if (fs.existsSync(file.src)) {
                if (fs.statSync(file.src).isDirectory()) {
                    // Copy directory
                    if (!fs.existsSync(file.dest)) {
                        fs.mkdirSync(file.dest, { recursive: true });
                    }
                    const files = fs.readdirSync(file.src);
                    for (const f of files) {
                        fs.copyFileSync(
                            path.join(file.src, f),
                            path.join(file.dest, f)
                        );
                    }
                } else {
                    // Copy file
                    fs.copyFileSync(file.src, file.dest);
                }
                console.log(`📋 Copied ${file.src} to ${file.dest}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Watch mode for development
if (process.argv.includes('--watch')) {
    console.log('👁️ Watching for changes...');
    
    esbuild.build({
        ...buildConfig,
        watch: {
            onRebuild(error, result) {
                if (error) {
                    console.error('❌ Rebuild failed:', error);
                } else {
                    console.log('✅ Rebuild completed');
                }
            },
        },
    }).then(() => {
        console.log('👁️ Watching...');
    });
} else {
    build();
}
