// The sample uses the same renderer, anchors and styles as the whole handbook.
process.argv[4] = '--chapters=R13';
await import('./build-handbook.mjs');
