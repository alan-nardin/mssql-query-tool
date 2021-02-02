const sql = require('mssql');
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl._writeToOutput = (stringToWrite) => {
    rl.output.write(rl.maskInput ? "*" : stringToWrite);
};

rl.on("close", function () {
    process.exit(0);
});

let config = { server: '', database: '', user: '', connection_string: '' }

function onFailed(color, message, callback){
    console.clear();
    console.log(color, message, "\x1b[0m");
    callback();
}

function runQuery (query) {

        sql.connect(config.connection_string, err_conn =>{

            if(err_conn){
                onFailed("\x1b[31m", "Connection failed", main);
                return;
            }

            new sql.Request().query(query, (err_query, res) =>{

                if(err_query){
                    sql.close();
                    onFailed("\x1b[33m", "Invalid query", startConsole);
                    return;
                }

                if (res.recordsets) {
                    res.recordsets.forEach(recordset => { console.table(recordset) });
                }

                if (res.rowsAffected.length) {
                    console.log(`Rows affected: ${res.rowsAffected[0]}`);
                }

                sql.close();
                startConsole();
            });
        });
}

function startConsole() {

    rl.question(`\x1b[36m${config.server}@${config.database}:Query>\x1b[0m `, function (query) {

        switch (query.toLowerCase()) {
            case 'quit':
            case 'exit':
                console.clear();
                rl.close();
                break;
            case 'clear':
            case 'cls':
                console.clear();
                startConsole();
                break;
            default: {
                runQuery(query);
            }
        }
    });
}

function onConnect(pwd){

        rl.maskInput = false;
        rl.history = [];

        config.connection_string = `Server=${config.server};Database=${config.database};User Id=${config.user};Password=${pwd}`;

        sql.connect(config.connection_string, err =>{
            if(err){
                onFailed("\x1b[31m", "Connection failed", main);
                return;
            }
            sql.close();
            console.clear();
            console.log("\x1b[32m", 'Successfully connected', "\x1b[0m");
            startConsole();
        });
    
}

function main() {

    rl.question("\x1b[36mServer>\x1b[0m ", (server) => {
        config.server = server;
        rl.question("\x1b[36mDatabase>\x1b[0m ", (database) => {
            config.database = database;
            rl.question("\x1b[36mUser>\x1b[0m ", (user) => {
                config.user = user;

                rl.setPrompt("\x1b[36mPassword>\x1b[0m ");
                rl.prompt();

                rl.maskInput = true;

                rl.on('line', onConnect);
            });
        });
    });
}

main();