import chalk from 'chalk';
import execa from 'execa';
import fs from 'fs';
import gitignore from 'gitignore';
import Listr from 'listr';
import ncp from 'ncp';
import path from 'path';
import { projectInstall } from 'pkg-install';
import license from 'spdx-license-list/licenses/MIT';
import { promisify } from 'util';

const access = promisify(fs.access);
const writeFile = promisify(fs.writeFile);
const copy = promisify(ncp);
const writeGitignore = promisify(gitignore.writeFile);

async function copyTemplateFiles(options) {
  const templateDir = path.resolve(
    process.cwd(),
    options.targetDirectory
  )
  if (!fs.existsSync(templateDir)) await fs.promises.mkdir(templateDir)
  const result = await execa('git', ['clone', options.gitRepository, templateDir], {
    cwd: templateDir
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}

async function initGit(options) {
  const result = await execa('git', ['init'], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd(),
    email: 'info@apptimizm.pro',
    name: 'Apptimizm',
  };

  const repos = {
    'landing': 'https://git.apptimizm.pro/templates/nuxt-landing-template',
    'site': 'https://git.apptimizm.pro/templates/nuxt-site-template'
  }

  const fullPathName = new URL(import.meta.url).pathname;
  const templateDir = path.resolve(
    fullPathName.substr(fullPathName.indexOf('/')),
    '../../templates',
    options.template.toLowerCase()
  );
  options.templateDirectory = templateDir;
  options.gitRepository = repos[options.template.toLowerCase()]

  const tasks = new Listr(
    [
      {
        title: 'Copy project files',
        task: () => copyTemplateFiles(options),
      },
      {
        title: 'Initialize git',
        task: () => initGit(options),
        enabled: () => options.git,
      },
      /*{
        title: 'Install dependencies',
        task: () =>
          projectInstall({
            cwd: options.targetDirectory,
          }),
        skip: () =>
          !options.runInstall
            ? undefined
            : undefined,
      },*/
    ],
    {
      exitOnError: false,
    }
  );

  await tasks.run();
  console.log('%s проект развернут', chalk.green.bold('DONE'));
  return true;
}
