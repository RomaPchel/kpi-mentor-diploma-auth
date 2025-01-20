import {MikroORM} from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { EntityManager } from '@mikro-orm/postgresql';

export const orm = await MikroORM.init({
    metadataProvider: TsMorphMetadataProvider,
    entities: ['/Users/romapchel/KPI/kpi-mentor-diploma-auth/app/dist/entities/*.js'],
    entitiesTs: ['/Users/romapchel/KPI/kpi-mentor-diploma-auth/app/src/entities/*.ts'],
    dbName: 'kpi-diploma',
});

export const em = orm.em.fork() as EntityManager;