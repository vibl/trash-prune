Your file trash might contain useful data. That's why you put some files in the trash rather than deleting them.

When you empty your file trash because it gets big or bloated, you lose everything that's in it.

This script helps you delete some of the files in the trash according to their age, size, extension and the requirements that you define (for example: keep only 2 GB of data), so that you can reclaim disk space or have a cleaner trash without emptying it.

# Install

`npm i -g @vibl/trash-prune`

# Usage

`trash-prune --help`

```
trash-prune [options]

Options:
      --help          Show help                                                                                          [boolean]
      --version       Show version number                                                                                [boolean]
  -g, --gb            GB of files to delete, keeping smallest files.                                                      [number]
  -n, --number        Number of files to delete. Useful to clean the trash file list.                                     [number]
  -k, --keep          Reverse the option: keep the specified amount of files or GB instead of deleting them.
                                                                                                        [boolean] [default: false]
  -u, --unattended    Do not ask confirmation before deleting files.                                    [boolean] [default: false]
  -s, --silent        Silent mode (implies --unattended).                                               [boolean] [default: false]
  -d, --debug         Debug mode.                                                                       [boolean] [default: false]
  -t, --trashDir      Trash directory path.                           [string] [default: "/home/vianney/.local/share/Trash/files"]
  -r, --rot           Rotting multiplier for specific extensions. Files are deleted as if they were N times bigger (or older). See
                      example below.
   [array] [default: ["0.1:js,ts,jsx,tsx,sh,rb,py,txt","10:nfo,url,srt,avi,mp4,mkv,jpeg,jpg,png,bmp,zip,gzip,bzip,bzip2,tar,rar"]]
      --keepEmptyDir  Do not delete (recursively) empty directories                                      [boolean] [default: true]

Examples:
  trash-prune -n 100                                  Delete 100 files
  trash-prune -kg 1                                   Keep 1 GB and delete the rest
  trash-prune --rot 0.01:sh,txt 100:htm,html,log  set rotting multiplier for specific extensions. You can set as many
                                                      multipliers as you want, separating them with a space. Use `--` to end the
                                                      list if you want to specify other options after this.

Use shell aliases for shortcuts. For example:

 alias tp='trash-prune -kg 1'
```


