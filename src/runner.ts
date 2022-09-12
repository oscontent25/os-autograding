import * as core from '@actions/core'
import {setCheckRunOutput} from './output'
import * as os from 'os'
import chalk from 'chalk'
import {readFileSync, readdirSync} from 'fs'
import path from 'path'

const color = new chalk.Instance({level: 1})

export type TestComparison = 'exact' | 'included' | 'regex'

export interface TestConfig {
  readonly outputFile: string
}

const log = (text: string): void => {
  process.stdout.write(text + os.EOL)
}

let resultPoints = {};

export const runAll = async (testConfig: TestConfig, cwd: string): Promise<void> => {
  let points = 0
  let availablePoints = 0

  // https://help.github.com/en/actions/reference/development-tools-for-github-actions#stop-and-start-log-commands-stop-commands
  log('::os autograding::')

  const fileValue = readFileSync(path.join(cwd, testConfig.outputFile)).toString()

  const classRoomPath = path.join(cwd, '.github/classroom/');
  let gradeFiles = readdirSync(classRoomPath);
  for(let i = 0;i < gradeFiles.length; i++) {
    let scriptFilePath = path.join(classRoomPath, gradeFiles[i])
    if(scriptFilePath.endsWith(".js")) {
      let scriptFile = await import(scriptFilePath)
      
      let result = scriptFile.judge(fileValue)
      resultPoints = {resultPoints, ...result}

      // output the result
      for(let key in result) {
        points += result[key][0];
        availablePoints += result[key][1];

        if (result[key][0] == result[key][1]) {
          log(color.green(`✅ ${key} pass`))
        } else {
          log(color.red(`❌ ${key} points ${result[key][0]}/${result[key][1]}`))
        }
      }
    }
  }
  // for (const test of testConfig.tests) {
  //   availablePoints += test.points

  //   if (test.contains) {
  //     if (fileValue.indexOf(test.contains) >= 0) {
  //       points += 2
  //     }
  //   }
  // }
  // for (const test of tests) {
  //   try {
  //     if (test.points) {
  //       availablePoints += test.points
  //     }
  //     log(color.cyan(`📝 ${test.name}`))
  //     log('')
  //     await run(test, cwd)
  //     log('')
  //     log(color.green(`✅ ${test.name}`))
  //     log(``)
  //     if (test.points) {
  //       points += test.points
  //     }
  //   } catch (error) {
  //     failed = true
  //     log('')
  //     log(color.red(`❌ ${test.name}`))
  //     // core.setFailed(error.message)
  //   }
  // }

  // Restart command processing

  // Set the number of points
  const text = `Points ${points}/${availablePoints}`
  log(color.bold.bgCyan.black(text))
  core.setOutput('Points', `${points}/${availablePoints}`)
  await setCheckRunOutput(text)

  if (points == availablePoints) {
    log('')
    log(color.green('All tests passed'))
    log('')
    log('✨🌟💖💎🦄💎💖🌟✨🌟💖💎🦄💎💖🌟✨')
    log('')
  }
}
