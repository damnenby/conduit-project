export interface DbService<Entity extends { id: number }> {
  connect(): Promise<void>;

  getAll(): Promise<Entity[]>;

  createOne(entity: Omit<Entity, 'id'>): Promise<Entity>;

  getOne(id: Entity['id']): Promise<Entity | undefined>;

  setOne(id: Entity['id'], entity: Entity): Promise<void>;

  deleteOne(id: Entity['id']): Promise<boolean>;
}
