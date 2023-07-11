import {EntityRepository, MikroORM} from '@mikro-orm/core';
import {User} from "../entities/UserEntity";
import type {MongoDriver} from '@mikro-orm/mongodb';
import {MongoEntityManager} from '@mikro-orm/mongodb';
import { ConfigEntity } from '../entities/ConfigEntity';
import { Stat } from '../entities/StatEntity';


const options = {
    type: 'mongo',
    entities: [User, ConfigEntity, Stat],
    dbName: process.env.DB_NAME,
    clientUrl: process.env.DEMO_DATABASE
};


export const DI = {} as {
    orm: MikroORM,
    em: MongoEntityManager,
    userRepository: EntityRepository<User>,
    configRepository: EntityRepository<ConfigEntity>,
    statRepository: EntityRepository<Stat>
};


export async function connect() {
    // @ts-ignore
    DI.orm = await MikroORM.init<MongoDriver>(options);
    DI.em = DI.orm.em as MongoEntityManager;

}

