/**
 * User Model Unit Tests
 *
 * Tests for the User data model classes and their functionality.
 */

import { UserModel, UserCollectionModel, GroupModel } from '@/lib/models/user';
import type { JiraUser, JiraGroup } from '@/types/jira-api';

describe('UserModel', () => {
  const mockUserData: JiraUser = {
    self: 'https://jira.example.com/rest/api/2/user?username=john.doe',
    id: '1001',
    name: 'john.doe',
    key: 'john.doe',
    displayName: 'John Doe',
    emailAddress: 'john.doe@example.com',
    active: true,
    timeZone: 'America/New_York',
    locale: 'en_US',
    avatarUrls: {
      '16x16': 'https://jira.example.com/secure/useravatar?size=xsmall&ownerId=john.doe',
      '24x24': 'https://jira.example.com/secure/useravatar?size=small&ownerId=john.doe',
      '32x32': 'https://jira.example.com/secure/useravatar?size=medium&ownerId=john.doe',
      '48x48': 'https://jira.example.com/secure/useravatar?ownerId=john.doe',
    },
    groups: {
      size: 2,
      items: [
        {
          self: 'https://jira.example.com/rest/api/2/group?groupname=developers',
          id: '2001',
          name: 'developers',
          groupId: 'dev-group',
        },
        {
          self: 'https://jira.example.com/rest/api/2/group?groupname=administrators',
          id: '2002',
          name: 'administrators',
          groupId: 'admin-group',
        },
      ],
    },
  };

  let userModel: UserModel;

  beforeEach(() => {
    userModel = new UserModel(mockUserData);
  });

  describe('Basic Properties', () => {
    it('should return basic identification properties', () => {
      expect(userModel.id).toBe('1001');
      expect(userModel.name).toBe('john.doe');
      expect(userModel.key).toBe('john.doe');
      expect(userModel.self).toBe('https://jira.example.com/rest/api/2/user?username=john.doe');
    });

    it('should return display information', () => {
      expect(userModel.displayName).toBe('John Doe');
      expect(userModel.emailAddress).toBe('john.doe@example.com');
    });

    it('should return user status', () => {
      expect(userModel.isActive).toBe(true);
    });

    it('should return locale and timezone', () => {
      expect(userModel.timeZone).toBe('America/New_York');
      expect(userModel.locale).toBe('en_US');
    });
  });

  describe('Avatar URLs', () => {
    it('should return all avatar URLs', () => {
      expect(userModel.avatarUrls).toEqual(mockUserData.avatarUrls);
    });

    it('should return specific avatar sizes', () => {
      expect(userModel.smallAvatar).toBe(mockUserData.avatarUrls['16x16']);
      expect(userModel.mediumAvatar).toBe(mockUserData.avatarUrls['24x24']);
      expect(userModel.largeAvatar).toBe(mockUserData.avatarUrls['48x48']);
    });

    it('should return best avatar for size preference', () => {
      expect(userModel.getBestAvatar('small')).toBe(mockUserData.avatarUrls['16x16']);
      expect(userModel.getBestAvatar('medium')).toBe(mockUserData.avatarUrls['24x24']);
      expect(userModel.getBestAvatar('large')).toBe(mockUserData.avatarUrls['48x48']);
      expect(userModel.getBestAvatar()).toBe(mockUserData.avatarUrls['24x24']); // default medium
    });
  });

  describe('Group Information', () => {
    it('should return group information', () => {
      expect(userModel.groups).toHaveLength(2);
      expect(userModel.groupCount).toBe(2);
      expect(userModel.hasGroups).toBe(true);
    });

    it('should check group membership', () => {
      expect(userModel.belongsToGroup('developers')).toBe(true);
      expect(userModel.belongsToGroup('administrators')).toBe(true);
      expect(userModel.belongsToGroup('users')).toBe(false);
      expect(userModel.belongsToGroup('DEVELOPERS')).toBe(true); // case insensitive
    });

    it('should return group names', () => {
      const groupNames = userModel.getGroupNames();
      expect(groupNames).toEqual(['developers', 'administrators']);
    });

    it('should handle users without groups', () => {
      const userWithoutGroups = new UserModel({
        ...mockUserData,
        groups: undefined,
      });

      expect(userWithoutGroups.groups).toEqual([]);
      expect(userWithoutGroups.groupCount).toBe(0);
      expect(userWithoutGroups.hasGroups).toBe(false);
      expect(userWithoutGroups.belongsToGroup('any')).toBe(false);
    });
  });

  describe('Display Utilities', () => {
    it('should generate initials correctly', () => {
      expect(userModel.initials).toBe('JD');
    });

    it('should handle single name for initials', () => {
      const singleNameUser = new UserModel({
        ...mockUserData,
        displayName: 'Madonna',
      });
      expect(singleNameUser.initials).toBe('MA');
    });

    it('should return short name', () => {
      expect(userModel.shortName).toBe('John');
    });

    it('should return username as short name if no display name', () => {
      const noDisplayNameUser = new UserModel({
        ...mockUserData,
        displayName: '',
      });
      expect(noDisplayNameUser.shortName).toBe('john.doe');
    });
  });

  describe('User Summary', () => {
    it('should return comprehensive user summary', () => {
      const summary = userModel.getSummary();
      expect(summary).toEqual({
        key: 'john.doe',
        name: 'john.doe',
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        isActive: true,
        avatar: mockUserData.avatarUrls['24x24'],
        initials: 'JD',
      });
    });
  });

  describe('Object Conversion', () => {
    it('should convert to plain object', () => {
      const obj = userModel.toObject();
      expect(obj).toHaveProperty('id', '1001');
      expect(obj).toHaveProperty('key', 'john.doe');
      expect(obj).toHaveProperty('displayName', 'John Doe');
      expect(obj).toHaveProperty('groups');
    });

    it('should convert to JSON string', () => {
      const json = userModel.toJSON();
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe('1001');
      expect(parsed.displayName).toBe('John Doe');
    });
  });

  describe('Equality', () => {
    it('should check equality with another UserModel', () => {
      const sameUser = new UserModel(mockUserData);
      const differentUser = new UserModel({ ...mockUserData, key: 'jane.smith' });

      expect(userModel.equals(sameUser)).toBe(true);
      expect(userModel.equals(differentUser)).toBe(false);
    });

    it('should check equality with raw JiraUser', () => {
      const sameUserData = { ...mockUserData };
      const differentUserData = { ...mockUserData, key: 'jane.smith' };

      expect(userModel.equals(sameUserData)).toBe(true);
      expect(userModel.equals(differentUserData)).toBe(false);
    });
  });

  describe('Static Methods', () => {
    it('should create UserModel from raw data', () => {
      const model = UserModel.from(mockUserData);
      expect(model).toBeInstanceOf(UserModel);
      expect(model.key).toBe('john.doe');
    });

    it('should create multiple UserModels from array', () => {
      const models = UserModel.fromArray([mockUserData, mockUserData]);
      expect(models).toHaveLength(2);
      expect(models[0]).toBeInstanceOf(UserModel);
      expect(models[1]).toBeInstanceOf(UserModel);
    });
  });
});

describe('UserCollectionModel', () => {
  const mockUsers: JiraUser[] = [
    {
      ...mockUserData,
      id: '1001',
      key: 'john.doe',
      name: 'john.doe',
      displayName: 'John Doe',
      emailAddress: 'john.doe@example.com',
      active: true,
      groups: {
        size: 1,
        items: [{ self: '', id: '2001', name: 'developers' }],
      },
    },
    {
      ...mockUserData,
      id: '1002',
      key: 'jane.smith',
      name: 'jane.smith',
      displayName: 'Jane Smith',
      emailAddress: 'jane.smith@example.com',
      active: true,
      groups: {
        size: 1,
        items: [{ self: '', id: '2002', name: 'administrators' }],
      },
    },
    {
      ...mockUserData,
      id: '1003',
      key: 'bob.wilson',
      name: 'bob.wilson',
      displayName: 'Bob Wilson',
      emailAddress: 'bob.wilson@example.com',
      active: false,
      groups: {
        size: 2,
        items: [
          { self: '', id: '2001', name: 'developers' },
          { self: '', id: '2002', name: 'administrators' },
        ],
      },
    },
  ];

  let collection: UserCollectionModel;

  beforeEach(() => {
    collection = UserCollectionModel.from(mockUsers);
  });

  describe('Basic Properties', () => {
    it('should return correct count', () => {
      expect(collection.count).toBe(3);
    });

    it('should return all users as UserModel instances', () => {
      const users = collection.users;
      expect(users).toHaveLength(3);
      expect(users[0]).toBeInstanceOf(UserModel);
      expect(users[1]).toBeInstanceOf(UserModel);
      expect(users[2]).toBeInstanceOf(UserModel);
    });
  });

  describe('Finding Users', () => {
    it('should find user by key', () => {
      const user = collection.findByKey('jane.smith');
      expect(user?.displayName).toBe('Jane Smith');
      expect(collection.findByKey('nonexistent')).toBeUndefined();
    });

    it('should find user by name', () => {
      const user = collection.findByName('john.doe');
      expect(user?.displayName).toBe('John Doe');
      expect(collection.findByName('JOHN.DOE')).toBeDefined(); // case insensitive
    });

    it('should find users by display name (partial match)', () => {
      const users = collection.findByDisplayName('John');
      expect(users).toHaveLength(1);
      expect(users[0].displayName).toBe('John Doe');

      const multipleUsers = collection.findByDisplayName('o'); // matches John and Bob
      expect(multipleUsers).toHaveLength(2);
    });

    it('should find user by email', () => {
      const user = collection.findByEmail('jane.smith@example.com');
      expect(user?.displayName).toBe('Jane Smith');
      expect(collection.findByEmail('JANE.SMITH@EXAMPLE.COM')).toBeDefined(); // case insensitive
    });
  });

  describe('Filtering', () => {
    it('should filter active users', () => {
      const activeUsers = collection.filterActive();
      expect(activeUsers.count).toBe(2);
      expect(activeUsers.users.every(user => user.isActive)).toBe(true);
    });

    it('should filter inactive users', () => {
      const inactiveUsers = collection.filterInactive();
      expect(inactiveUsers.count).toBe(1);
      expect(inactiveUsers.users[0].displayName).toBe('Bob Wilson');
    });

    it('should filter users by group', () => {
      const developers = collection.filterByGroup('developers');
      expect(developers.count).toBe(2); // John and Bob
      
      const admins = collection.filterByGroup('administrators');
      expect(admins.count).toBe(2); // Jane and Bob
    });
  });

  describe('Group Operations', () => {
    it('should get all unique groups', () => {
      const allGroups = collection.getAllGroups();
      expect(allGroups).toEqual(['administrators', 'developers']); // sorted
    });

    it('should group users by groups', () => {
      const grouped = collection.groupByGroups();
      expect(grouped.has('developers')).toBe(true);
      expect(grouped.has('administrators')).toBe(true);
      expect(grouped.get('developers')).toHaveLength(2);
      expect(grouped.get('administrators')).toHaveLength(2);
    });

    it('should handle users without groups in grouping', () => {
      const usersWithNoGroups = [
        { ...mockUsers[0], groups: undefined },
        ...mockUsers.slice(1),
      ];
      const collectionWithNoGroups = UserCollectionModel.from(usersWithNoGroups);
      const grouped = collectionWithNoGroups.groupByGroups();
      
      expect(grouped.has('No Groups')).toBe(true);
      expect(grouped.get('No Groups')).toHaveLength(1);
    });
  });

  describe('Sorting', () => {
    it('should sort users by display name', () => {
      const sorted = collection.sortByDisplayName(true);
      const names = sorted.users.map(user => user.displayName);
      expect(names).toEqual(['Bob Wilson', 'Jane Smith', 'John Doe']);
    });

    it('should sort users by display name descending', () => {
      const sorted = collection.sortByDisplayName(false);
      const names = sorted.users.map(user => user.displayName);
      expect(names).toEqual(['John Doe', 'Jane Smith', 'Bob Wilson']);
    });

    it('should sort users by username', () => {
      const sorted = collection.sortByName(true);
      const names = sorted.users.map(user => user.name);
      expect(names).toEqual(['bob.wilson', 'jane.smith', 'john.doe']);
    });
  });

  describe('Summary Operations', () => {
    it('should get user summaries', () => {
      const summaries = collection.getSummaries();
      expect(summaries).toHaveLength(3);
      expect(summaries[0]).toHaveProperty('key');
      expect(summaries[0]).toHaveProperty('displayName');
      expect(summaries[0]).toHaveProperty('isActive');
    });
  });

  describe('Conversion', () => {
    it('should convert to array of plain objects', () => {
      const array = collection.toArray();
      expect(array).toHaveLength(3);
      expect(array[0]).toHaveProperty('key', 'john.doe');
      expect(array[0]).toHaveProperty('displayName', 'John Doe');
    });
  });

  describe('Static Methods', () => {
    it('should create collection from JiraUser array', () => {
      const newCollection = UserCollectionModel.from(mockUsers);
      expect(newCollection).toBeInstanceOf(UserCollectionModel);
      expect(newCollection.count).toBe(3);
    });
  });
});

describe('GroupModel', () => {
  const mockGroupData: JiraGroup = {
    self: 'https://jira.example.com/rest/api/2/group?groupname=developers',
    id: '2001',
    name: 'developers',
    groupId: 'dev-group',
  };

  let groupModel: GroupModel;

  beforeEach(() => {
    groupModel = new GroupModel(mockGroupData);
  });

  describe('Basic Properties', () => {
    it('should return basic identification properties', () => {
      expect(groupModel.id).toBe('2001');
      expect(groupModel.name).toBe('developers');
      expect(groupModel.self).toBe('https://jira.example.com/rest/api/2/group?groupname=developers');
      expect(groupModel.groupId).toBe('dev-group');
    });
  });

  describe('Object Conversion', () => {
    it('should convert to plain object', () => {
      const obj = groupModel.toObject();
      expect(obj).toEqual({
        id: '2001',
        name: 'developers',
        groupId: 'dev-group',
        self: 'https://jira.example.com/rest/api/2/group?groupname=developers',
      });
    });

    it('should convert to JSON string', () => {
      const json = groupModel.toJSON();
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe('2001');
      expect(parsed.name).toBe('developers');
    });
  });

  describe('Static Methods', () => {
    it('should create GroupModel from raw data', () => {
      const model = GroupModel.from(mockGroupData);
      expect(model).toBeInstanceOf(GroupModel);
      expect(model.name).toBe('developers');
    });

    it('should create multiple GroupModels from array', () => {
      const models = GroupModel.fromArray([mockGroupData, mockGroupData]);
      expect(models).toHaveLength(2);
      expect(models[0]).toBeInstanceOf(GroupModel);
      expect(models[1]).toBeInstanceOf(GroupModel);
    });
  });
});

// Export mock data for use in other tests
export { mockUserData };