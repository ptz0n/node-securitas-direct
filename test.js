const nock = require('nock');
const tk = require('timekeeper');

const SecuritasDirect = require('.');

nock.disableNetConnect();
const scope = nock('https://mob2217.securitasdirect.es:12010/WebService/').log(console.log);

describe('ES', () => {
  tk.freeze(new Date('2020-02-06T21:02:54.868Z'));

  const client = new SecuritasDirect('john', 'topsecret', 'es');

  const loginParams = {
    ...client.params,
    request: 'LOGIN',
  };

  const transactionParams = {
    ...client.params,
    callby: 'AND_61',
    numinst: '2423443',
    panel: 'SDVFAST',
    hash: '11111111111',
  };

  afterEach(() => {
    expect(nock.isDone()).toBe(true); // nock.pendingMocks()
  });

  test('login should get hash for user', async () => {
    scope.post('/ws.do').query(loginParams)
      .replyWithFile(200, `${__dirname}/test/responses/LOGIN.xml`);

    const hash = await client.login();

    expect(hash).toBe('11111111111');
    expect(client.params.hash).toBe('11111111111');
  });

  test('should renew hash when session has expired', async () => {
    client.params.hash = 'expired';

    scope.get('/ws.do').query({ ...transactionParams, request: 'EST1', hash: 'expired' })
      .replyWithFile(200, `${__dirname}/test/responses/ERROR-60022.xml`);

    scope.post('/ws.do').query(loginParams)
      .replyWithFile(200, `${__dirname}/test/responses/LOGIN.xml`);

    scope.get('/ws.do').query({ ...transactionParams, request: 'EST1' })
      .replyWithFile(200, `${__dirname}/test/responses/EST1.xml`);

    scope.get('/ws.do').query({ ...transactionParams, request: 'EST2' })
      .replyWithFile(200, `${__dirname}/test/responses/EST2-WAIT.xml`);

    scope.get('/ws.do').query({ ...transactionParams, request: 'EST2' })
      .replyWithFile(200, `${__dirname}/test/responses/EST2.xml`);

    const { STATUS } = await client.transaction('EST', '2423443', 'SDVFAST');

    expect(client.params.hash).toBe('11111111111');
    expect(STATUS[0]).toBe('0');
  }, 20000);

  test('should get installation', async () => {
    scope.post('/ws.do').query({
      ...client.params,
      numinst: '2423443',
      request: 'MYINSTALLATION',
    }).replyWithFile(200, `${__dirname}/test/responses/MYINSTALLATION.xml`);

    const installation = await client.getInstallation('2423443');

    expect(installation.DEVICES.length).toBe(1);
  });

  test('should get panel status', async () => {
    scope.get('/ws.do').query({ ...transactionParams, request: 'EST1' })
      .replyWithFile(200, `${__dirname}/test/responses/EST1.xml`);

    scope.get('/ws.do').query({ ...transactionParams, request: 'EST2' })
      .times(3)
      .replyWithFile(200, `${__dirname}/test/responses/EST2-WAIT.xml`);

    scope.get('/ws.do').query({ ...transactionParams, request: 'EST2' })
      .replyWithFile(200, `${__dirname}/test/responses/EST2.xml`);

    const { NUMINST, STATUS } = await client.transaction('EST', '2423443', 'SDVFAST');

    expect(NUMINST[0]).toBe('2423443');
    expect(STATUS[0]).toBe('0');
  });

  test('should throw with too many retries', () => {
    scope.get('/ws.do').query({ ...transactionParams, request: 'ASD2' })
      .times(2)
      .replyWithFile(200, `${__dirname}/test/responses/EST2-WAIT.xml`);

    return expect(client.transaction('ASD', '2423443', 'SDVFAST', 9)).rejects
      .toThrow('Too many retries');
  });
});
