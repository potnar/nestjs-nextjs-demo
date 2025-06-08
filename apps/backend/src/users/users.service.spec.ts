import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  it('should create and retrieve a user', () => {
    const user = service.create({ name: 'Jan', email: 'jan@example.com' });
    expect(service.findOne(user.id)).toEqual(user);
  });

  it('should return all users', () => {
    service.create({ name: 'A', email: 'a@example.com' });
    service.create({ name: 'B', email: 'b@example.com' });
    expect(service.findAll().length).toBe(2);
  });
});
