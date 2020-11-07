#!/usr/bin/env node
"use strict";
const execa = require("execa");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers")
const Table = require("cli-table3");
const fs = require("fs-extra");
const _ = require("lodash");
const prettyBytes = require("pretty-bytes");
const Path = require("path");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");
const { prompts } = require("prompts");

const option = yargs(hideBin(process.argv))
  .locale('en')
  .usage("$0 [options]")
  .options({
    gb: {
      alias: "g",
      type: "number",
      description: "GB of files to delete, keeping smallest files."
    },
    number: {
      alias: "n",
      type: "number",
      description: "Number of files to delete. Useful to clean the trash file list."
    },
    keep: {
      alias: "k",
      type: "boolean",
      default: false,
      description: "Reverse the option: keep the specified amount of files or GB instead of deleting them."
    },
    unattended: {
      alias: "u",
      type: "boolean",
      default: false,
      description: "Do not ask confirmation before deleting files."
    },
    silent: {
      alias: "s",
      type: "boolean",
      default: false,
      description: "Silent mode (implies --unattended)."
    },
    debug: {
      alias: "d",
      type: "boolean",
      default: false,
      description: "Debug mode."
    },
    trashDir: {
      alias: "t",
      type: "string",
      normalize: true,
      default: Path.join(process.env.HOME, ".local/share/Trash/files"),
      description: "Trash directory path."
    },
    rot: {
      alias: "r",
      array: true,
      type: "string",
      default: ["0.1:js,ts,jsx,tsx,sh,rb,py,txt", "10:nfo,url,srt,avi,mp4,mkv,jpeg,jpg,png,bmp,zip,gzip,bzip,bzip2,tar,rar"],
      description: "Rotting multiplier for specific extensions. Files are deleted as if they were N times bigger (or older). See example below.",
      coerce: (list) => {
        const res = {};
        for(const opt of list) {
          const [multStr, extStr] = opt.split(":");
          const mult = Number(multStr);
          const extList = extStr.split(",");
          if( !extList || isNaN(mult) ) {
            throw new Error(`--rot option argument should be in the format shown in the example. ${isNaN(mult) && "Could not parse multiplier."} ${!extList && "Could not parse extensions list."}`)
          };
          for(const ext of extList) {
            res[ext] = mult;
          }
        }
        return res;
      }
    },
    keepEmptyDir: {
      type: "boolean",
      default: true,
      description: "Do not delete (recursively) empty directories",
    }
  })
  .check((argv) => {
    if( argv.number >= 0 && argv.gb >= 0 ) {
      throw new Error("Either `--number` or `--gb` should be specified. Aborting.");
    } else {
      return true
    }
  })
  .example([
    ["trash-prune -n 100", "Delete 100 files"],
    ["trash-prune -kg 1", "Keep 1 GB and delete the rest"],
    ["trash-prune --rotMult 0.01:sh,txt 100:htm,html,log", "set rotting multiplier for specific extensions. You can set as many multipliers as you want, separating them with a space. Use `--` to end the list if you want to specify other options after this."]
  ])
  .epilogue("Go wild with your shell aliases! For example:\n\n alias tp='trash-prune -kg 1'")
  .wrap(yargs.terminalWidth())
  .argv;

const { trashDir } = option;

function log(...args) {
  if( !option.silent ) {
    console.log(...args);
  }
}
function exec(command, ...args) {
  return execa(command, args);
} 

function computeNull(n, i, list) {
  return n !== null ? n : yargs.terminalWidth() - _.sum(list) - list.length - 1;
}
 
const table = new Table({
  head: ["Type", "Name", "Last accessed", "Size", "Rot (log10)"], 
  colAligns: ["left", "left", "right", "right", "right"],
});

async function diskUsage (path) {
  const duRes = await exec("du", "-bs", path);
  return parseInt(duRes.stdout.match(/^\d+/m)?.[0]);
};

function getExtFactor(filePath) {
  const ext = Path.extname(filePath).slice(1);
  return option.rot[ext] ?? 1;
}

async function getDirFactor(dirPath) {

  const findRes = await exec("find", dirPath, "-type", "f")
   const childPaths = findRes.stdout.split("\n");
  if (childPaths.length === 0) return !option.keepEmptyDir ? 10**10 : 1;

  const sum = childPaths.reduce( (sum, path) => sum + getExtFactor(path), 0);
  return sum / childPaths.length

};

function abort (str) {
  log(`${str} Aborting.`);
  return process.exit()
};

function deleteEntry(entry) {
  if( !entry.name ) return
  log("Deleting:", entry.name);
  const path = Path.join(trashDir, entry.name);
  return fs.remove(path);
}

const main = async () => {

  const names = await fs.readdir(trashDir);
  
  let entries = [];
  let totalSize = 0;
  
  for (const name of names) {
    const path = Path.join(trashDir, name);
    try {
      const stat = await fs.stat(path);
      const isDir = stat.isDirectory();
      const size = isDir
        ? await diskUsage(path)
        : stat.size;
  
      totalSize += size;
  
      const lastAccessed = stat.atime;
      const sizeFactor = option.gb ? size : 1;
      const typeFactor = stat.isDirectory() ? await getDirFactor(path) : getExtFactor(path);
  
      entries.push({
        isDir,
        name,
        size,
        lastAccessed,
        rot: Math.log10(lastAccessed * sizeFactor * typeFactor)
      })
    } catch (err) {
        console.error(err);
    }
  };
  
  const entryCount = names.length;
    
  let deleteN = 0, deleteByte = 0;

  if (option.number) {
    const maxDelete = Math.min(option.number, entryCount);
    deleteN = option.keep ? entryCount - maxDelete : maxDelete;
    if (deleteN === 0) abort("No file/directory to delete.")
  }
  if (option.gb) {
    const maxBytes =  option.gb * 2 ** 30;
    const limit = [maxBytes, totalSize].min;
    deleteByte = option.keep ? totalSize - limit : limit;
    if (deleteByte === 0) abort("No file/directory to delete.")
  }

  log(`Trash size: ${prettyBytes(totalSize)} in ${entryCount} files.`);


  const entriesSorted = _.sortBy(entries, entry => entry.rot).reverse();
  let deletedByte = 0;
  let deletedNum = 0;
  const candidates = [];
  
  for (const entry of entriesSorted) {
    if ((option.number && deletedNum >= deleteN) ?? (option.gb && deletedByte >= deleteByte)) {
      break
    };
  
    deletedByte += entry.size;
    deletedNum++;
    candidates.push(entry);
  
    table.push([
      entry.isDir ? "dir" : "file",
      entry.name,
      formatDistanceToNow(entry.lastAccessed) + " ago",
      prettyBytes(entry.size),
      entry.rot.toPrecision(3),
    ]);
  };
  
  log("Ready to delete these files:");
  
  log(table.toString());
  
  log(`TOTAL: ${prettyBytes(deletedByte)} in ${deletedNum} files/directories.`);
  log(`(Keeping ${entryCount - deletedNum} files, ${prettyBytes(totalSize - deletedByte)})`);
  
  if (!(option.unattended || option.silent)) {

    const confirmed = await prompts.confirm({message: "Delete these files?"});
    if (!confirmed) abort("You chose to cancel.")
  }

  await Promise.all(candidates.map(deleteEntry));  

  return `${deletedNum} files or directories deleted.`;
}

main().then(log).catch(console.error);


