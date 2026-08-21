import { defineConfig } from "jsrepo";

export default defineConfig({
  registries: [],
  paths: {
    component: './components',
    "*": './components'
  }
});
