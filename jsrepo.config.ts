import { defineConfig } from 'jsrepo';

export default defineConfig({
    registries: ['https://reactbits.dev/r'],
    paths: {
        component: 'resources/js/Components/ReactBits',
        '*': 'resources/js/Components/ReactBits',
    },
});
