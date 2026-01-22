// Bridge to App.jsx to solve "not a module" and extension resolution issues
// @ts-ignore
// Fix: Use direct re-export syntax to resolve circular definition of import alias 'MainApp'
export { default } from './App.jsx';