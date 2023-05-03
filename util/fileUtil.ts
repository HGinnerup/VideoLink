import * as fs from "fs"
import * as fsAsync from "fs/promises"
import * as path from "path"


async function _search(dir:string, predicate:((name:string, stats:fs.Stats)=>Promise<boolean>)):Promise<string> {
    let items = await fsAsync.readdir(dir)

    let crawlers = items.map(async name => {
        let itemPath = path.join(dir, name);
        let stats = await fsAsync.stat(itemPath)

        if(stats.isDirectory()) {
            return await _search(itemPath, predicate);
        }
        else if (stats.isSymbolicLink()) {
            return await _search(itemPath, predicate);
        }
        else if(stats.isFile()) {
            if(await predicate(itemPath, stats))
                return itemPath;

            throw "File not found"
        }
        else {
            let err = new Error("Weird file??");
            // @ts-ignore
            err.fileStats = stats
            throw err;
        }
    });
        

    // @ts-ignore - Supported by Node.js 15+, but TS doesn't seem to know Promise.any https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any
    return await Promise.any(crawlers)
}

export async function search(dir:string, predicate:((name:string, stats:fs.Stats)=>Promise<boolean>)):Promise<string | null> {
    try {
        return await _search(path.resolve(dir), predicate)
    }
    catch(err) {
        if(err === "File not found")
            return null;
            // @ts-ignore
        else if(err.message === "All promises were rejected")
            return null;
        
        throw err;
    }
}




