import { Get, Post, Body, Put, Delete, Param, Query, Controller, HttpCode,ParseIntPipe, ParseBoolPipe, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { GameLoungeCreateDto } from '../dtos/game-lounge-create.dto';
import { GameLoungeUserAddDto } from '../dtos/game-lounge-user-add.dto';
import { GameLoungeTemporalClient } from '../temporal/game-lounge-temporal-client';
import { addUserSignal, finishGameSignal, isGameFinishedQuery } from '../temporal/workflows/game-lounge.workflow';


@ApiBearerAuth()
@ApiTags('temporal')
@Controller('temporal')
export class TemporalController { 

  constructor( private readonly gameLoungeTemporalClient:GameLoungeTemporalClient) {}

  @ApiOperation({ summary: 'Run temporal flow' })
  @ApiResponse({ status: 201, description: 'The flow has been successfully executed' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @Post()
  async createGameLounge(@Body(/*new ValidationPipe(VALIDATION_SCHEMA_GAMING_LOUNGE_CREATE)*/) gameLoungeCreateDto: GameLoungeCreateDto): Promise<string> {
    console.log(`running game lounge temporal controller with params:${JSON.stringify(gameLoungeCreateDto)}`)
    let result:string = await this.gameLoungeTemporalClient.run({...gameLoungeCreateDto, deleted:false});
    return result;
  }

  @ApiOperation({ summary: 'Run temporal flow' })
  @ApiResponse({ status: 201, description: 'The flow has been successfully executed' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @Post(':workFlowId/adduser/')
  async addUser(@Param('workFlowId') workFlowId: string,@Body(/*new ValidationPipe(VALIDATION_SCHEMA_GAMING_LOUNGE_CREATE)*/) gameLoungeUserAddDto: GameLoungeUserAddDto): Promise<void> {
    console.log(`sending signal to  temporal workflow:${workFlowId}`)
    const handle = await this.gameLoungeTemporalClient.client.getHandle(workFlowId);
    await handle.signal(addUserSignal,{gameLoungeId:-1, ...gameLoungeUserAddDto});
  }

  @ApiOperation({ summary: 'Send Game Finished signal to  temporal flow' })
  @ApiResponse({ status: 201, description: 'The signal has been successfully sent' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @Post(':workFlowId/game/:gameId')
  async finishGame(@Param('workFlowId') workFlowId: string, @Param('gameId', ParseIntPipe) gameId: number): Promise<void> {
    console.log(`sending signal to  temporal workflow:${workFlowId}`)
    const handle = await this.gameLoungeTemporalClient.client.getHandle(workFlowId);

    await handle.signal(finishGameSignal);
  }

  @ApiOperation({ summary: 'Query game status whether it has finished or not.' })
  @ApiParam({ name: "workFlowId", description: "Unique workflow id generated by the system for the game lounge workflows and entities.", required: true, allowEmptyValue: false })
  @ApiResponse({ status: 200, description: 'Return game finished status of game lounge flow found by the given id.'})
  @ApiResponse({ status: 400, description: 'Invalid id.' })
  @ApiResponse({ status: 404, description: 'Game lounge flow not found by the given id.' })
  @Get(':workFlowId/game/status')
  async queryGameStatus(@Param('workFlowId') workFlowId: string): Promise<boolean> {
    
    const handle = await this.gameLoungeTemporalClient.client.getHandle(workFlowId);
    let isGameFinised = await handle.query(isGameFinishedQuery);
    return isGameFinised;
  }
}