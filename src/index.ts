import { Config } from '@jest/types'
import { join } from 'path'
import fs from 'fs'
import jsonfile from 'jsonfile'

type JestConfig = Config.InitialOptions

export const defineJestConfig = (options: JestConfig, isMonorepo = false): JestConfig => {
    const rootOptions: JestConfig = {
        // jest-watch-typeahead and suspend
        watchPlugins: [],
    }
    const baseOptions: JestConfig = {
        preset: 'ts-jest',
        testPathIgnorePatterns: ['/build/'],
    }
    if (isMonorepo) {
        const fromMonorepo = (...p: string[]) => join(process.cwd(), 'packages', ...p)
        const packagesDirs = fs.readdirSync(fromMonorepo()).filter(monorepoPackage => {
            const fromPackage = (...p: string[]) => join(process.cwd(), 'packages', monorepoPackage, ...p)
            if (!fs.existsSync(fromPackage('package.json'))) return false
            const packageJson = jsonfile.readFileSync(fromPackage('package.json'))
            if (packageJson.private || !packageJson.types) return false
            return true
        })
        rootOptions.watchPlugins!.push(require.resolve('jest-watch-select-projects'))
        return {
            projects: packagesDirs.map(dir => ({
                displayName: dir,
                testMatch: [`<rootDir>/packages/${dir}/**/*.test.ts`],
                // ...rootOptions,
                ...baseOptions,
            })),
        }
    }
    return {
        ...baseOptions,
        ...rootOptions,
    }
}
