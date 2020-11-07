Your file trash might contain useful data. That's why you put some files in the trash rather than deleting them.

When you empty your file trash because it gets big or bloated, you lose everything that's in it.

This script helps you delete some of the files in the trash according to their age, size, extension and the requirements that you define (for example: keep only 2 GB of data), so that you can reclaim disk space or have a cleaner trash without emptying it.

## Install

`npm i -g @vibl/trash-prune`

## Usage

`trash-prune --help`

```
trash-prune [options]

Options:
      --help          Show help                                                                                                      
      --version       Show version number                                                                                            
  -g, --gb            GB of files to delete, keeping smallest files.                                                                 
  -n, --number        Number of files to delete. Useful to clean the trash file list.                                                
  -k, --keep          Reverse the option: keep the specified amount of files or GB instead of deleting them.                         
  -u, --unattended    Do not ask confirmation before deleting files.                                                                 
  -s, --silent        Silent mode (implies --unattended).                                                                            
  -d, --debug         Debug mode.                                                                                                    
  -t, --trashDir      Trash directory path.                                                                                          
  -r, --rot           Rotting multiplier for specific extensions. Files are deleted as if they were N times bigger (or older). See ex
                                                                                   [array] [default: ["0.1:js,ts,jsx,tsx,sh,rb,py,txt
      --keepEmptyDir  Do not delete (recursively) empty directories                                                                  

Examples:
  trash-prune -n 100                              Delete 100 files
  trash-prune -kg 1                               Keep 1 GB and delete the rest
  trash-prune --rot 0.01:sh,txt 100:htm,html,log  Set rotting multiplier for specific extensions. You can set as many multipliers as 
                                                  to specify other options after this.

Use shell aliases for shortcuts. For example:

 alias tp='trash-prune -kg 1'
 ```


