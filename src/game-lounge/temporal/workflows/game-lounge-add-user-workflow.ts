import * as wf from "@temporalio/workflow";
import { CreateGameLoungeUserProps, GameLoungeUserEntity } from "src/game-lounge/entities/game-lounge-user.entity";
import { AccountEntity } from "src/wallet/entities/account.entity";
import { GameLoungeUserActivityFactory } from "../activities/game-lounge-user.activities";




export async function addUserFlow(gameLoungeUser: CreateGameLoungeUserProps): Promise<GameLoungeUserEntity> {
    
    let { addUser, removeUser, refoundFee, withdrawFee } = wf.proxyActivities<ReturnType<typeof GameLoungeUserActivityFactory>>({
        startToCloseTimeout: "130 seconds",
        retry: { initialInterval: "5s", backoffCoefficient: 2 },
    });

    console.log(`running wokflow addUserFlow with params:${JSON.stringify(gameLoungeUser)}`);

    let userAccount:AccountEntity = await withdrawFee(gameLoungeUser); 

    let glUser:GameLoungeUserEntity = await addUser(gameLoungeUser);   
    
    return glUser;
} 
