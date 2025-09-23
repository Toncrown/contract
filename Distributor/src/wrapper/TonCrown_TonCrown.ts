import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwner = {
    $$type: 'ChangeOwner';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwner(src: ChangeOwner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2174598809, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2174598809) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwner(source: ChangeOwner) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwner(): DictionaryValue<ChangeOwner> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwner(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwner(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwnerOk = {
    $$type: 'ChangeOwnerOk';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwnerOk(src: ChangeOwnerOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(846932810, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwnerOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 846932810) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwnerOk(source: ChangeOwnerOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwnerOk(): DictionaryValue<ChangeOwnerOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwnerOk(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwnerOk(src.loadRef().beginParse());
        }
    }
}

export type StakeInfo = {
    $$type: 'StakeInfo';
    stakeId: bigint;
    amount: bigint;
    startTime: bigint;
    duration: bigint;
    vipClass: bigint;
    autoRestake: boolean;
    lastClaim: bigint;
    totalClaimed: bigint;
    isActive: boolean;
    stakedAsset: bigint;
}

export function storeStakeInfo(src: StakeInfo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.stakeId, 16);
        b_0.storeCoins(src.amount);
        b_0.storeUint(src.startTime, 32);
        b_0.storeUint(src.duration, 32);
        b_0.storeUint(src.vipClass, 8);
        b_0.storeBit(src.autoRestake);
        b_0.storeUint(src.lastClaim, 32);
        b_0.storeCoins(src.totalClaimed);
        b_0.storeBit(src.isActive);
        b_0.storeUint(src.stakedAsset, 8);
    };
}

export function loadStakeInfo(slice: Slice) {
    const sc_0 = slice;
    const _stakeId = sc_0.loadUintBig(16);
    const _amount = sc_0.loadCoins();
    const _startTime = sc_0.loadUintBig(32);
    const _duration = sc_0.loadUintBig(32);
    const _vipClass = sc_0.loadUintBig(8);
    const _autoRestake = sc_0.loadBit();
    const _lastClaim = sc_0.loadUintBig(32);
    const _totalClaimed = sc_0.loadCoins();
    const _isActive = sc_0.loadBit();
    const _stakedAsset = sc_0.loadUintBig(8);
    return { $$type: 'StakeInfo' as const, stakeId: _stakeId, amount: _amount, startTime: _startTime, duration: _duration, vipClass: _vipClass, autoRestake: _autoRestake, lastClaim: _lastClaim, totalClaimed: _totalClaimed, isActive: _isActive, stakedAsset: _stakedAsset };
}

export function loadTupleStakeInfo(source: TupleReader) {
    const _stakeId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _startTime = source.readBigNumber();
    const _duration = source.readBigNumber();
    const _vipClass = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    const _lastClaim = source.readBigNumber();
    const _totalClaimed = source.readBigNumber();
    const _isActive = source.readBoolean();
    const _stakedAsset = source.readBigNumber();
    return { $$type: 'StakeInfo' as const, stakeId: _stakeId, amount: _amount, startTime: _startTime, duration: _duration, vipClass: _vipClass, autoRestake: _autoRestake, lastClaim: _lastClaim, totalClaimed: _totalClaimed, isActive: _isActive, stakedAsset: _stakedAsset };
}

export function loadGetterTupleStakeInfo(source: TupleReader) {
    const _stakeId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _startTime = source.readBigNumber();
    const _duration = source.readBigNumber();
    const _vipClass = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    const _lastClaim = source.readBigNumber();
    const _totalClaimed = source.readBigNumber();
    const _isActive = source.readBoolean();
    const _stakedAsset = source.readBigNumber();
    return { $$type: 'StakeInfo' as const, stakeId: _stakeId, amount: _amount, startTime: _startTime, duration: _duration, vipClass: _vipClass, autoRestake: _autoRestake, lastClaim: _lastClaim, totalClaimed: _totalClaimed, isActive: _isActive, stakedAsset: _stakedAsset };
}

export function storeTupleStakeInfo(source: StakeInfo) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.stakeId);
    builder.writeNumber(source.amount);
    builder.writeNumber(source.startTime);
    builder.writeNumber(source.duration);
    builder.writeNumber(source.vipClass);
    builder.writeBoolean(source.autoRestake);
    builder.writeNumber(source.lastClaim);
    builder.writeNumber(source.totalClaimed);
    builder.writeBoolean(source.isActive);
    builder.writeNumber(source.stakedAsset);
    return builder.build();
}

export function dictValueParserStakeInfo(): DictionaryValue<StakeInfo> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStakeInfo(src)).endCell());
        },
        parse: (src) => {
            return loadStakeInfo(src.loadRef().beginParse());
        }
    }
}

export type User = {
    $$type: 'User';
    referrer: Address | null;
    level: bigint;
    vipClass: bigint;
    directReferrals: bigint;
    totalReferrals: bigint;
    otherReferrals: bigint;
    lastCheckIn: bigint;
    levelExpiration: bigint;
    totalEarned: bigint;
    isActive: boolean;
    registrationTime: bigint;
    stakeCounter: bigint;
    stakes: Dictionary<bigint, StakeInfo>;
    downlines: Dictionary<bigint, Address>;
    spilloverIndex: bigint;
}

export function storeUser(src: User) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.referrer);
        b_0.storeUint(src.level, 8);
        b_0.storeUint(src.vipClass, 8);
        b_0.storeUint(src.directReferrals, 16);
        b_0.storeUint(src.totalReferrals, 32);
        b_0.storeUint(src.otherReferrals, 32);
        b_0.storeUint(src.lastCheckIn, 32);
        b_0.storeUint(src.levelExpiration, 32);
        b_0.storeCoins(src.totalEarned);
        b_0.storeBit(src.isActive);
        b_0.storeUint(src.registrationTime, 32);
        b_0.storeUint(src.stakeCounter, 16);
        b_0.storeDict(src.stakes, Dictionary.Keys.BigInt(257), dictValueParserStakeInfo());
        b_0.storeDict(src.downlines, Dictionary.Keys.BigInt(257), Dictionary.Values.Address());
        b_0.storeUint(src.spilloverIndex, 16);
    };
}

export function loadUser(slice: Slice) {
    const sc_0 = slice;
    const _referrer = sc_0.loadMaybeAddress();
    const _level = sc_0.loadUintBig(8);
    const _vipClass = sc_0.loadUintBig(8);
    const _directReferrals = sc_0.loadUintBig(16);
    const _totalReferrals = sc_0.loadUintBig(32);
    const _otherReferrals = sc_0.loadUintBig(32);
    const _lastCheckIn = sc_0.loadUintBig(32);
    const _levelExpiration = sc_0.loadUintBig(32);
    const _totalEarned = sc_0.loadCoins();
    const _isActive = sc_0.loadBit();
    const _registrationTime = sc_0.loadUintBig(32);
    const _stakeCounter = sc_0.loadUintBig(16);
    const _stakes = Dictionary.load(Dictionary.Keys.BigInt(257), dictValueParserStakeInfo(), sc_0);
    const _downlines = Dictionary.load(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), sc_0);
    const _spilloverIndex = sc_0.loadUintBig(16);
    return { $$type: 'User' as const, referrer: _referrer, level: _level, vipClass: _vipClass, directReferrals: _directReferrals, totalReferrals: _totalReferrals, otherReferrals: _otherReferrals, lastCheckIn: _lastCheckIn, levelExpiration: _levelExpiration, totalEarned: _totalEarned, isActive: _isActive, registrationTime: _registrationTime, stakeCounter: _stakeCounter, stakes: _stakes, downlines: _downlines, spilloverIndex: _spilloverIndex };
}

export function loadTupleUser(source: TupleReader) {
    const _referrer = source.readAddressOpt();
    const _level = source.readBigNumber();
    const _vipClass = source.readBigNumber();
    const _directReferrals = source.readBigNumber();
    const _totalReferrals = source.readBigNumber();
    const _otherReferrals = source.readBigNumber();
    const _lastCheckIn = source.readBigNumber();
    const _levelExpiration = source.readBigNumber();
    const _totalEarned = source.readBigNumber();
    const _isActive = source.readBoolean();
    const _registrationTime = source.readBigNumber();
    const _stakeCounter = source.readBigNumber();
    const _stakes = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserStakeInfo(), source.readCellOpt());
    const _downlines = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), source.readCellOpt());
    const _spilloverIndex = source.readBigNumber();
    return { $$type: 'User' as const, referrer: _referrer, level: _level, vipClass: _vipClass, directReferrals: _directReferrals, totalReferrals: _totalReferrals, otherReferrals: _otherReferrals, lastCheckIn: _lastCheckIn, levelExpiration: _levelExpiration, totalEarned: _totalEarned, isActive: _isActive, registrationTime: _registrationTime, stakeCounter: _stakeCounter, stakes: _stakes, downlines: _downlines, spilloverIndex: _spilloverIndex };
}

export function loadGetterTupleUser(source: TupleReader) {
    const _referrer = source.readAddressOpt();
    const _level = source.readBigNumber();
    const _vipClass = source.readBigNumber();
    const _directReferrals = source.readBigNumber();
    const _totalReferrals = source.readBigNumber();
    const _otherReferrals = source.readBigNumber();
    const _lastCheckIn = source.readBigNumber();
    const _levelExpiration = source.readBigNumber();
    const _totalEarned = source.readBigNumber();
    const _isActive = source.readBoolean();
    const _registrationTime = source.readBigNumber();
    const _stakeCounter = source.readBigNumber();
    const _stakes = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserStakeInfo(), source.readCellOpt());
    const _downlines = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), source.readCellOpt());
    const _spilloverIndex = source.readBigNumber();
    return { $$type: 'User' as const, referrer: _referrer, level: _level, vipClass: _vipClass, directReferrals: _directReferrals, totalReferrals: _totalReferrals, otherReferrals: _otherReferrals, lastCheckIn: _lastCheckIn, levelExpiration: _levelExpiration, totalEarned: _totalEarned, isActive: _isActive, registrationTime: _registrationTime, stakeCounter: _stakeCounter, stakes: _stakes, downlines: _downlines, spilloverIndex: _spilloverIndex };
}

export function storeTupleUser(source: User) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.referrer);
    builder.writeNumber(source.level);
    builder.writeNumber(source.vipClass);
    builder.writeNumber(source.directReferrals);
    builder.writeNumber(source.totalReferrals);
    builder.writeNumber(source.otherReferrals);
    builder.writeNumber(source.lastCheckIn);
    builder.writeNumber(source.levelExpiration);
    builder.writeNumber(source.totalEarned);
    builder.writeBoolean(source.isActive);
    builder.writeNumber(source.registrationTime);
    builder.writeNumber(source.stakeCounter);
    builder.writeCell(source.stakes.size > 0 ? beginCell().storeDictDirect(source.stakes, Dictionary.Keys.BigInt(257), dictValueParserStakeInfo()).endCell() : null);
    builder.writeCell(source.downlines.size > 0 ? beginCell().storeDictDirect(source.downlines, Dictionary.Keys.BigInt(257), Dictionary.Values.Address()).endCell() : null);
    builder.writeNumber(source.spilloverIndex);
    return builder.build();
}

export function dictValueParserUser(): DictionaryValue<User> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUser(src)).endCell());
        },
        parse: (src) => {
            return loadUser(src.loadRef().beginParse());
        }
    }
}

export type VipConfig = {
    $$type: 'VipConfig';
    dailyRoi: bigint;
    minLevel: bigint;
    maxLevel: bigint;
    stakingRoi: bigint;
}

export function storeVipConfig(src: VipConfig) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.dailyRoi, 16);
        b_0.storeUint(src.minLevel, 8);
        b_0.storeUint(src.maxLevel, 8);
        b_0.storeUint(src.stakingRoi, 16);
    };
}

export function loadVipConfig(slice: Slice) {
    const sc_0 = slice;
    const _dailyRoi = sc_0.loadUintBig(16);
    const _minLevel = sc_0.loadUintBig(8);
    const _maxLevel = sc_0.loadUintBig(8);
    const _stakingRoi = sc_0.loadUintBig(16);
    return { $$type: 'VipConfig' as const, dailyRoi: _dailyRoi, minLevel: _minLevel, maxLevel: _maxLevel, stakingRoi: _stakingRoi };
}

export function loadTupleVipConfig(source: TupleReader) {
    const _dailyRoi = source.readBigNumber();
    const _minLevel = source.readBigNumber();
    const _maxLevel = source.readBigNumber();
    const _stakingRoi = source.readBigNumber();
    return { $$type: 'VipConfig' as const, dailyRoi: _dailyRoi, minLevel: _minLevel, maxLevel: _maxLevel, stakingRoi: _stakingRoi };
}

export function loadGetterTupleVipConfig(source: TupleReader) {
    const _dailyRoi = source.readBigNumber();
    const _minLevel = source.readBigNumber();
    const _maxLevel = source.readBigNumber();
    const _stakingRoi = source.readBigNumber();
    return { $$type: 'VipConfig' as const, dailyRoi: _dailyRoi, minLevel: _minLevel, maxLevel: _maxLevel, stakingRoi: _stakingRoi };
}

export function storeTupleVipConfig(source: VipConfig) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.dailyRoi);
    builder.writeNumber(source.minLevel);
    builder.writeNumber(source.maxLevel);
    builder.writeNumber(source.stakingRoi);
    return builder.build();
}

export function dictValueParserVipConfig(): DictionaryValue<VipConfig> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVipConfig(src)).endCell());
        },
        parse: (src) => {
            return loadVipConfig(src.loadRef().beginParse());
        }
    }
}

export type PlatformStats = {
    $$type: 'PlatformStats';
    totalUsers: bigint;
    totalStakedTon: bigint;
    totalStakedUsdt: bigint;
    totalDistributed: bigint;
    activeStakes: bigint;
}

export function storePlatformStats(src: PlatformStats) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.totalUsers, 32);
        b_0.storeCoins(src.totalStakedTon);
        b_0.storeCoins(src.totalStakedUsdt);
        b_0.storeCoins(src.totalDistributed);
        b_0.storeUint(src.activeStakes, 32);
    };
}

export function loadPlatformStats(slice: Slice) {
    const sc_0 = slice;
    const _totalUsers = sc_0.loadUintBig(32);
    const _totalStakedTon = sc_0.loadCoins();
    const _totalStakedUsdt = sc_0.loadCoins();
    const _totalDistributed = sc_0.loadCoins();
    const _activeStakes = sc_0.loadUintBig(32);
    return { $$type: 'PlatformStats' as const, totalUsers: _totalUsers, totalStakedTon: _totalStakedTon, totalStakedUsdt: _totalStakedUsdt, totalDistributed: _totalDistributed, activeStakes: _activeStakes };
}

export function loadTuplePlatformStats(source: TupleReader) {
    const _totalUsers = source.readBigNumber();
    const _totalStakedTon = source.readBigNumber();
    const _totalStakedUsdt = source.readBigNumber();
    const _totalDistributed = source.readBigNumber();
    const _activeStakes = source.readBigNumber();
    return { $$type: 'PlatformStats' as const, totalUsers: _totalUsers, totalStakedTon: _totalStakedTon, totalStakedUsdt: _totalStakedUsdt, totalDistributed: _totalDistributed, activeStakes: _activeStakes };
}

export function loadGetterTuplePlatformStats(source: TupleReader) {
    const _totalUsers = source.readBigNumber();
    const _totalStakedTon = source.readBigNumber();
    const _totalStakedUsdt = source.readBigNumber();
    const _totalDistributed = source.readBigNumber();
    const _activeStakes = source.readBigNumber();
    return { $$type: 'PlatformStats' as const, totalUsers: _totalUsers, totalStakedTon: _totalStakedTon, totalStakedUsdt: _totalStakedUsdt, totalDistributed: _totalDistributed, activeStakes: _activeStakes };
}

export function storeTuplePlatformStats(source: PlatformStats) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.totalUsers);
    builder.writeNumber(source.totalStakedTon);
    builder.writeNumber(source.totalStakedUsdt);
    builder.writeNumber(source.totalDistributed);
    builder.writeNumber(source.activeStakes);
    return builder.build();
}

export function dictValueParserPlatformStats(): DictionaryValue<PlatformStats> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePlatformStats(src)).endCell());
        },
        parse: (src) => {
            return loadPlatformStats(src.loadRef().beginParse());
        }
    }
}

export type UpgradeLevel = {
    $$type: 'UpgradeLevel';
    targetLevel: bigint;
    referrerAddress: Address | null;
}

export function storeUpgradeLevel(src: UpgradeLevel) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2984784977, 32);
        b_0.storeUint(src.targetLevel, 8);
        b_0.storeAddress(src.referrerAddress);
    };
}

export function loadUpgradeLevel(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2984784977) { throw Error('Invalid prefix'); }
    const _targetLevel = sc_0.loadUintBig(8);
    const _referrerAddress = sc_0.loadMaybeAddress();
    return { $$type: 'UpgradeLevel' as const, targetLevel: _targetLevel, referrerAddress: _referrerAddress };
}

export function loadTupleUpgradeLevel(source: TupleReader) {
    const _targetLevel = source.readBigNumber();
    const _referrerAddress = source.readAddressOpt();
    return { $$type: 'UpgradeLevel' as const, targetLevel: _targetLevel, referrerAddress: _referrerAddress };
}

export function loadGetterTupleUpgradeLevel(source: TupleReader) {
    const _targetLevel = source.readBigNumber();
    const _referrerAddress = source.readAddressOpt();
    return { $$type: 'UpgradeLevel' as const, targetLevel: _targetLevel, referrerAddress: _referrerAddress };
}

export function storeTupleUpgradeLevel(source: UpgradeLevel) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.targetLevel);
    builder.writeAddress(source.referrerAddress);
    return builder.build();
}

export function dictValueParserUpgradeLevel(): DictionaryValue<UpgradeLevel> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUpgradeLevel(src)).endCell());
        },
        parse: (src) => {
            return loadUpgradeLevel(src.loadRef().beginParse());
        }
    }
}

export type CheckIn = {
    $$type: 'CheckIn';
}

export function storeCheckIn(src: CheckIn) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(928085272, 32);
    };
}

export function loadCheckIn(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 928085272) { throw Error('Invalid prefix'); }
    return { $$type: 'CheckIn' as const };
}

export function loadTupleCheckIn(source: TupleReader) {
    return { $$type: 'CheckIn' as const };
}

export function loadGetterTupleCheckIn(source: TupleReader) {
    return { $$type: 'CheckIn' as const };
}

export function storeTupleCheckIn(source: CheckIn) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserCheckIn(): DictionaryValue<CheckIn> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCheckIn(src)).endCell());
        },
        parse: (src) => {
            return loadCheckIn(src.loadRef().beginParse());
        }
    }
}

export type StakeTON = {
    $$type: 'StakeTON';
    duration: bigint;
    autoRestake: boolean;
    referrerAddress: Address | null;
}

export function storeStakeTON(src: StakeTON) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4239787765, 32);
        b_0.storeUint(src.duration, 32);
        b_0.storeBit(src.autoRestake);
        b_0.storeAddress(src.referrerAddress);
    };
}

export function loadStakeTON(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4239787765) { throw Error('Invalid prefix'); }
    const _duration = sc_0.loadUintBig(32);
    const _autoRestake = sc_0.loadBit();
    const _referrerAddress = sc_0.loadMaybeAddress();
    return { $$type: 'StakeTON' as const, duration: _duration, autoRestake: _autoRestake, referrerAddress: _referrerAddress };
}

export function loadTupleStakeTON(source: TupleReader) {
    const _duration = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    const _referrerAddress = source.readAddressOpt();
    return { $$type: 'StakeTON' as const, duration: _duration, autoRestake: _autoRestake, referrerAddress: _referrerAddress };
}

export function loadGetterTupleStakeTON(source: TupleReader) {
    const _duration = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    const _referrerAddress = source.readAddressOpt();
    return { $$type: 'StakeTON' as const, duration: _duration, autoRestake: _autoRestake, referrerAddress: _referrerAddress };
}

export function storeTupleStakeTON(source: StakeTON) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.duration);
    builder.writeBoolean(source.autoRestake);
    builder.writeAddress(source.referrerAddress);
    return builder.build();
}

export function dictValueParserStakeTON(): DictionaryValue<StakeTON> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStakeTON(src)).endCell());
        },
        parse: (src) => {
            return loadStakeTON(src.loadRef().beginParse());
        }
    }
}

export type ClaimStakingRewards = {
    $$type: 'ClaimStakingRewards';
    stakeId: bigint;
}

export function storeClaimStakingRewards(src: ClaimStakingRewards) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1698125262, 32);
        b_0.storeUint(src.stakeId, 16);
    };
}

export function loadClaimStakingRewards(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1698125262) { throw Error('Invalid prefix'); }
    const _stakeId = sc_0.loadUintBig(16);
    return { $$type: 'ClaimStakingRewards' as const, stakeId: _stakeId };
}

export function loadTupleClaimStakingRewards(source: TupleReader) {
    const _stakeId = source.readBigNumber();
    return { $$type: 'ClaimStakingRewards' as const, stakeId: _stakeId };
}

export function loadGetterTupleClaimStakingRewards(source: TupleReader) {
    const _stakeId = source.readBigNumber();
    return { $$type: 'ClaimStakingRewards' as const, stakeId: _stakeId };
}

export function storeTupleClaimStakingRewards(source: ClaimStakingRewards) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.stakeId);
    return builder.build();
}

export function dictValueParserClaimStakingRewards(): DictionaryValue<ClaimStakingRewards> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeClaimStakingRewards(src)).endCell());
        },
        parse: (src) => {
            return loadClaimStakingRewards(src.loadRef().beginParse());
        }
    }
}

export type UpdateAutoRestake = {
    $$type: 'UpdateAutoRestake';
    stakeId: bigint;
    autoRestake: boolean;
}

export function storeUpdateAutoRestake(src: UpdateAutoRestake) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3359594178, 32);
        b_0.storeUint(src.stakeId, 16);
        b_0.storeBit(src.autoRestake);
    };
}

export function loadUpdateAutoRestake(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3359594178) { throw Error('Invalid prefix'); }
    const _stakeId = sc_0.loadUintBig(16);
    const _autoRestake = sc_0.loadBit();
    return { $$type: 'UpdateAutoRestake' as const, stakeId: _stakeId, autoRestake: _autoRestake };
}

export function loadTupleUpdateAutoRestake(source: TupleReader) {
    const _stakeId = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    return { $$type: 'UpdateAutoRestake' as const, stakeId: _stakeId, autoRestake: _autoRestake };
}

export function loadGetterTupleUpdateAutoRestake(source: TupleReader) {
    const _stakeId = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    return { $$type: 'UpdateAutoRestake' as const, stakeId: _stakeId, autoRestake: _autoRestake };
}

export function storeTupleUpdateAutoRestake(source: UpdateAutoRestake) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.stakeId);
    builder.writeBoolean(source.autoRestake);
    return builder.build();
}

export function dictValueParserUpdateAutoRestake(): DictionaryValue<UpdateAutoRestake> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUpdateAutoRestake(src)).endCell());
        },
        parse: (src) => {
            return loadUpdateAutoRestake(src.loadRef().beginParse());
        }
    }
}

export type StakeUsdtPayload = {
    $$type: 'StakeUsdtPayload';
    duration: bigint;
    autoRestake: boolean;
    referrerAddress: Address | null;
}

export function storeStakeUsdtPayload(src: StakeUsdtPayload) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.duration, 32);
        b_0.storeBit(src.autoRestake);
        b_0.storeAddress(src.referrerAddress);
    };
}

export function loadStakeUsdtPayload(slice: Slice) {
    const sc_0 = slice;
    const _duration = sc_0.loadUintBig(32);
    const _autoRestake = sc_0.loadBit();
    const _referrerAddress = sc_0.loadMaybeAddress();
    return { $$type: 'StakeUsdtPayload' as const, duration: _duration, autoRestake: _autoRestake, referrerAddress: _referrerAddress };
}

export function loadTupleStakeUsdtPayload(source: TupleReader) {
    const _duration = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    const _referrerAddress = source.readAddressOpt();
    return { $$type: 'StakeUsdtPayload' as const, duration: _duration, autoRestake: _autoRestake, referrerAddress: _referrerAddress };
}

export function loadGetterTupleStakeUsdtPayload(source: TupleReader) {
    const _duration = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    const _referrerAddress = source.readAddressOpt();
    return { $$type: 'StakeUsdtPayload' as const, duration: _duration, autoRestake: _autoRestake, referrerAddress: _referrerAddress };
}

export function storeTupleStakeUsdtPayload(source: StakeUsdtPayload) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.duration);
    builder.writeBoolean(source.autoRestake);
    builder.writeAddress(source.referrerAddress);
    return builder.build();
}

export function dictValueParserStakeUsdtPayload(): DictionaryValue<StakeUsdtPayload> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStakeUsdtPayload(src)).endCell());
        },
        parse: (src) => {
            return loadStakeUsdtPayload(src.loadRef().beginParse());
        }
    }
}

export type JettonTransferNotification = {
    $$type: 'JettonTransferNotification';
    queryId: bigint;
    amount: bigint;
    sender: Address;
    forwardPayload: Slice;
}

export function storeJettonTransferNotification(src: JettonTransferNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855772, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadJettonTransferNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855772) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _forwardPayload = sc_0;
    return { $$type: 'JettonTransferNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function loadTupleJettonTransferNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonTransferNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function loadGetterTupleJettonTransferNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'JettonTransferNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function storeTupleJettonTransferNotification(source: JettonTransferNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserJettonTransferNotification(): DictionaryValue<JettonTransferNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonTransferNotification(src)).endCell());
        },
        parse: (src) => {
            return loadJettonTransferNotification(src.loadRef().beginParse());
        }
    }
}

export type JettonTransfer = {
    $$type: 'JettonTransfer';
    queryId: bigint;
    amount: bigint;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell | null;
    forward_ton_amount: bigint;
    forward_payload: Slice;
}

export function storeJettonTransfer(src: JettonTransfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(260734629, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.destination);
        b_0.storeAddress(src.response_destination);
        if (src.custom_payload !== null && src.custom_payload !== undefined) { b_0.storeBit(true).storeRef(src.custom_payload); } else { b_0.storeBit(false); }
        b_0.storeCoins(src.forward_ton_amount);
        b_0.storeBuilder(src.forward_payload.asBuilder());
    };
}

export function loadJettonTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 260734629) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _destination = sc_0.loadAddress();
    const _response_destination = sc_0.loadAddress();
    const _custom_payload = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _forward_ton_amount = sc_0.loadCoins();
    const _forward_payload = sc_0;
    return { $$type: 'JettonTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadTupleJettonTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _response_destination = source.readAddress();
    const _custom_payload = source.readCellOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'JettonTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadGetterTupleJettonTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _response_destination = source.readAddress();
    const _custom_payload = source.readCellOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'JettonTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function storeTupleJettonTransfer(source: JettonTransfer) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.destination);
    builder.writeAddress(source.response_destination);
    builder.writeCell(source.custom_payload);
    builder.writeNumber(source.forward_ton_amount);
    builder.writeSlice(source.forward_payload.asCell());
    return builder.build();
}

export function dictValueParserJettonTransfer(): DictionaryValue<JettonTransfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadJettonTransfer(src.loadRef().beginParse());
        }
    }
}

export type DistributeDailyRewards = {
    $$type: 'DistributeDailyRewards';
    user: Address;
    stakeId: bigint;
}

export function storeDistributeDailyRewards(src: DistributeDailyRewards) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4118358367, 32);
        b_0.storeAddress(src.user);
        b_0.storeUint(src.stakeId, 16);
    };
}

export function loadDistributeDailyRewards(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4118358367) { throw Error('Invalid prefix'); }
    const _user = sc_0.loadAddress();
    const _stakeId = sc_0.loadUintBig(16);
    return { $$type: 'DistributeDailyRewards' as const, user: _user, stakeId: _stakeId };
}

export function loadTupleDistributeDailyRewards(source: TupleReader) {
    const _user = source.readAddress();
    const _stakeId = source.readBigNumber();
    return { $$type: 'DistributeDailyRewards' as const, user: _user, stakeId: _stakeId };
}

export function loadGetterTupleDistributeDailyRewards(source: TupleReader) {
    const _user = source.readAddress();
    const _stakeId = source.readBigNumber();
    return { $$type: 'DistributeDailyRewards' as const, user: _user, stakeId: _stakeId };
}

export function storeTupleDistributeDailyRewards(source: DistributeDailyRewards) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.user);
    builder.writeNumber(source.stakeId);
    return builder.build();
}

export function dictValueParserDistributeDailyRewards(): DictionaryValue<DistributeDailyRewards> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDistributeDailyRewards(src)).endCell());
        },
        parse: (src) => {
            return loadDistributeDailyRewards(src.loadRef().beginParse());
        }
    }
}

export type UpdateLevelCost = {
    $$type: 'UpdateLevelCost';
    level: bigint;
    cost: bigint;
}

export function storeUpdateLevelCost(src: UpdateLevelCost) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3820349697, 32);
        b_0.storeUint(src.level, 8);
        b_0.storeCoins(src.cost);
    };
}

export function loadUpdateLevelCost(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3820349697) { throw Error('Invalid prefix'); }
    const _level = sc_0.loadUintBig(8);
    const _cost = sc_0.loadCoins();
    return { $$type: 'UpdateLevelCost' as const, level: _level, cost: _cost };
}

export function loadTupleUpdateLevelCost(source: TupleReader) {
    const _level = source.readBigNumber();
    const _cost = source.readBigNumber();
    return { $$type: 'UpdateLevelCost' as const, level: _level, cost: _cost };
}

export function loadGetterTupleUpdateLevelCost(source: TupleReader) {
    const _level = source.readBigNumber();
    const _cost = source.readBigNumber();
    return { $$type: 'UpdateLevelCost' as const, level: _level, cost: _cost };
}

export function storeTupleUpdateLevelCost(source: UpdateLevelCost) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.level);
    builder.writeNumber(source.cost);
    return builder.build();
}

export function dictValueParserUpdateLevelCost(): DictionaryValue<UpdateLevelCost> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUpdateLevelCost(src)).endCell());
        },
        parse: (src) => {
            return loadUpdateLevelCost(src.loadRef().beginParse());
        }
    }
}

export type SetUsdtJettonWallet = {
    $$type: 'SetUsdtJettonWallet';
    wallet: Address;
}

export function storeSetUsdtJettonWallet(src: SetUsdtJettonWallet) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2766193506, 32);
        b_0.storeAddress(src.wallet);
    };
}

export function loadSetUsdtJettonWallet(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2766193506) { throw Error('Invalid prefix'); }
    const _wallet = sc_0.loadAddress();
    return { $$type: 'SetUsdtJettonWallet' as const, wallet: _wallet };
}

export function loadTupleSetUsdtJettonWallet(source: TupleReader) {
    const _wallet = source.readAddress();
    return { $$type: 'SetUsdtJettonWallet' as const, wallet: _wallet };
}

export function loadGetterTupleSetUsdtJettonWallet(source: TupleReader) {
    const _wallet = source.readAddress();
    return { $$type: 'SetUsdtJettonWallet' as const, wallet: _wallet };
}

export function storeTupleSetUsdtJettonWallet(source: SetUsdtJettonWallet) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.wallet);
    return builder.build();
}

export function dictValueParserSetUsdtJettonWallet(): DictionaryValue<SetUsdtJettonWallet> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetUsdtJettonWallet(src)).endCell());
        },
        parse: (src) => {
            return loadSetUsdtJettonWallet(src.loadRef().beginParse());
        }
    }
}

export type SetDistributor = {
    $$type: 'SetDistributor';
    address: Address;
}

export function storeSetDistributor(src: SetDistributor) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3179496197, 32);
        b_0.storeAddress(src.address);
    };
}

export function loadSetDistributor(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3179496197) { throw Error('Invalid prefix'); }
    const _address = sc_0.loadAddress();
    return { $$type: 'SetDistributor' as const, address: _address };
}

export function loadTupleSetDistributor(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'SetDistributor' as const, address: _address };
}

export function loadGetterTupleSetDistributor(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'SetDistributor' as const, address: _address };
}

export function storeTupleSetDistributor(source: SetDistributor) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.address);
    return builder.build();
}

export function dictValueParserSetDistributor(): DictionaryValue<SetDistributor> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetDistributor(src)).endCell());
        },
        parse: (src) => {
            return loadSetDistributor(src.loadRef().beginParse());
        }
    }
}

export type TonCrown$Data = {
    $$type: 'TonCrown$Data';
    owner: Address;
    creatorWallet1: Address;
    creatorWallet2: Address;
    creatorWallet3: Address;
    creatorWallet4: Address;
    usdtJettonWalletAddress: Address;
    distributorAddress: Address;
    users: Dictionary<Address, User>;
    levelCosts: Dictionary<bigint, bigint>;
    vipConfigs: Dictionary<bigint, VipConfig>;
    totalUsers: bigint;
    totalStakedTon: bigint;
    totalStakedUsdt: bigint;
    totalDistributed: bigint;
    activeStakes: bigint;
    isPaused: boolean;
    userList: Dictionary<bigint, Address>;
    spilloverRecipientIndex: bigint;
    spilloverCycle: bigint;
    userLastCycle: Dictionary<Address, bigint>;
}

export function storeTonCrown$Data(src: TonCrown$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.creatorWallet1);
        b_0.storeAddress(src.creatorWallet2);
        const b_1 = new Builder();
        b_1.storeAddress(src.creatorWallet3);
        b_1.storeAddress(src.creatorWallet4);
        b_1.storeAddress(src.usdtJettonWalletAddress);
        const b_2 = new Builder();
        b_2.storeAddress(src.distributorAddress);
        b_2.storeDict(src.users, Dictionary.Keys.Address(), dictValueParserUser());
        b_2.storeDict(src.levelCosts, Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257));
        b_2.storeDict(src.vipConfigs, Dictionary.Keys.BigInt(257), dictValueParserVipConfig());
        b_2.storeUint(src.totalUsers, 32);
        b_2.storeCoins(src.totalStakedTon);
        b_2.storeCoins(src.totalStakedUsdt);
        b_2.storeCoins(src.totalDistributed);
        b_2.storeUint(src.activeStakes, 32);
        b_2.storeBit(src.isPaused);
        const b_3 = new Builder();
        b_3.storeDict(src.userList, Dictionary.Keys.BigInt(257), Dictionary.Values.Address());
        b_3.storeUint(src.spilloverRecipientIndex, 32);
        b_3.storeUint(src.spilloverCycle, 64);
        b_3.storeDict(src.userLastCycle, Dictionary.Keys.Address(), Dictionary.Values.BigUint(64));
        b_2.storeRef(b_3.endCell());
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadTonCrown$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _creatorWallet1 = sc_0.loadAddress();
    const _creatorWallet2 = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _creatorWallet3 = sc_1.loadAddress();
    const _creatorWallet4 = sc_1.loadAddress();
    const _usdtJettonWalletAddress = sc_1.loadAddress();
    const sc_2 = sc_1.loadRef().beginParse();
    const _distributorAddress = sc_2.loadAddress();
    const _users = Dictionary.load(Dictionary.Keys.Address(), dictValueParserUser(), sc_2);
    const _levelCosts = Dictionary.load(Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257), sc_2);
    const _vipConfigs = Dictionary.load(Dictionary.Keys.BigInt(257), dictValueParserVipConfig(), sc_2);
    const _totalUsers = sc_2.loadUintBig(32);
    const _totalStakedTon = sc_2.loadCoins();
    const _totalStakedUsdt = sc_2.loadCoins();
    const _totalDistributed = sc_2.loadCoins();
    const _activeStakes = sc_2.loadUintBig(32);
    const _isPaused = sc_2.loadBit();
    const sc_3 = sc_2.loadRef().beginParse();
    const _userList = Dictionary.load(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), sc_3);
    const _spilloverRecipientIndex = sc_3.loadUintBig(32);
    const _spilloverCycle = sc_3.loadUintBig(64);
    const _userLastCycle = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigUint(64), sc_3);
    return { $$type: 'TonCrown$Data' as const, owner: _owner, creatorWallet1: _creatorWallet1, creatorWallet2: _creatorWallet2, creatorWallet3: _creatorWallet3, creatorWallet4: _creatorWallet4, usdtJettonWalletAddress: _usdtJettonWalletAddress, distributorAddress: _distributorAddress, users: _users, levelCosts: _levelCosts, vipConfigs: _vipConfigs, totalUsers: _totalUsers, totalStakedTon: _totalStakedTon, totalStakedUsdt: _totalStakedUsdt, totalDistributed: _totalDistributed, activeStakes: _activeStakes, isPaused: _isPaused, userList: _userList, spilloverRecipientIndex: _spilloverRecipientIndex, spilloverCycle: _spilloverCycle, userLastCycle: _userLastCycle };
}

export function loadTupleTonCrown$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _creatorWallet1 = source.readAddress();
    const _creatorWallet2 = source.readAddress();
    const _creatorWallet3 = source.readAddress();
    const _creatorWallet4 = source.readAddress();
    const _usdtJettonWalletAddress = source.readAddress();
    const _distributorAddress = source.readAddress();
    const _users = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserUser(), source.readCellOpt());
    const _levelCosts = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _vipConfigs = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserVipConfig(), source.readCellOpt());
    const _totalUsers = source.readBigNumber();
    const _totalStakedTon = source.readBigNumber();
    const _totalStakedUsdt = source.readBigNumber();
    const _totalDistributed = source.readBigNumber();
    source = source.readTuple();
    const _activeStakes = source.readBigNumber();
    const _isPaused = source.readBoolean();
    const _userList = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), source.readCellOpt());
    const _spilloverRecipientIndex = source.readBigNumber();
    const _spilloverCycle = source.readBigNumber();
    const _userLastCycle = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigUint(64), source.readCellOpt());
    return { $$type: 'TonCrown$Data' as const, owner: _owner, creatorWallet1: _creatorWallet1, creatorWallet2: _creatorWallet2, creatorWallet3: _creatorWallet3, creatorWallet4: _creatorWallet4, usdtJettonWalletAddress: _usdtJettonWalletAddress, distributorAddress: _distributorAddress, users: _users, levelCosts: _levelCosts, vipConfigs: _vipConfigs, totalUsers: _totalUsers, totalStakedTon: _totalStakedTon, totalStakedUsdt: _totalStakedUsdt, totalDistributed: _totalDistributed, activeStakes: _activeStakes, isPaused: _isPaused, userList: _userList, spilloverRecipientIndex: _spilloverRecipientIndex, spilloverCycle: _spilloverCycle, userLastCycle: _userLastCycle };
}

export function loadGetterTupleTonCrown$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _creatorWallet1 = source.readAddress();
    const _creatorWallet2 = source.readAddress();
    const _creatorWallet3 = source.readAddress();
    const _creatorWallet4 = source.readAddress();
    const _usdtJettonWalletAddress = source.readAddress();
    const _distributorAddress = source.readAddress();
    const _users = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserUser(), source.readCellOpt());
    const _levelCosts = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _vipConfigs = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserVipConfig(), source.readCellOpt());
    const _totalUsers = source.readBigNumber();
    const _totalStakedTon = source.readBigNumber();
    const _totalStakedUsdt = source.readBigNumber();
    const _totalDistributed = source.readBigNumber();
    const _activeStakes = source.readBigNumber();
    const _isPaused = source.readBoolean();
    const _userList = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), source.readCellOpt());
    const _spilloverRecipientIndex = source.readBigNumber();
    const _spilloverCycle = source.readBigNumber();
    const _userLastCycle = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigUint(64), source.readCellOpt());
    return { $$type: 'TonCrown$Data' as const, owner: _owner, creatorWallet1: _creatorWallet1, creatorWallet2: _creatorWallet2, creatorWallet3: _creatorWallet3, creatorWallet4: _creatorWallet4, usdtJettonWalletAddress: _usdtJettonWalletAddress, distributorAddress: _distributorAddress, users: _users, levelCosts: _levelCosts, vipConfigs: _vipConfigs, totalUsers: _totalUsers, totalStakedTon: _totalStakedTon, totalStakedUsdt: _totalStakedUsdt, totalDistributed: _totalDistributed, activeStakes: _activeStakes, isPaused: _isPaused, userList: _userList, spilloverRecipientIndex: _spilloverRecipientIndex, spilloverCycle: _spilloverCycle, userLastCycle: _userLastCycle };
}

export function storeTupleTonCrown$Data(source: TonCrown$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.creatorWallet1);
    builder.writeAddress(source.creatorWallet2);
    builder.writeAddress(source.creatorWallet3);
    builder.writeAddress(source.creatorWallet4);
    builder.writeAddress(source.usdtJettonWalletAddress);
    builder.writeAddress(source.distributorAddress);
    builder.writeCell(source.users.size > 0 ? beginCell().storeDictDirect(source.users, Dictionary.Keys.Address(), dictValueParserUser()).endCell() : null);
    builder.writeCell(source.levelCosts.size > 0 ? beginCell().storeDictDirect(source.levelCosts, Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.vipConfigs.size > 0 ? beginCell().storeDictDirect(source.vipConfigs, Dictionary.Keys.BigInt(257), dictValueParserVipConfig()).endCell() : null);
    builder.writeNumber(source.totalUsers);
    builder.writeNumber(source.totalStakedTon);
    builder.writeNumber(source.totalStakedUsdt);
    builder.writeNumber(source.totalDistributed);
    builder.writeNumber(source.activeStakes);
    builder.writeBoolean(source.isPaused);
    builder.writeCell(source.userList.size > 0 ? beginCell().storeDictDirect(source.userList, Dictionary.Keys.BigInt(257), Dictionary.Values.Address()).endCell() : null);
    builder.writeNumber(source.spilloverRecipientIndex);
    builder.writeNumber(source.spilloverCycle);
    builder.writeCell(source.userLastCycle.size > 0 ? beginCell().storeDictDirect(source.userLastCycle, Dictionary.Keys.Address(), Dictionary.Values.BigUint(64)).endCell() : null);
    return builder.build();
}

export function dictValueParserTonCrown$Data(): DictionaryValue<TonCrown$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTonCrown$Data(src)).endCell());
        },
        parse: (src) => {
            return loadTonCrown$Data(src.loadRef().beginParse());
        }
    }
}

 type TonCrown_init_args = {
    $$type: 'TonCrown_init_args';
    owner: Address;
}

function initTonCrown_init_args(src: TonCrown_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
    };
}

async function TonCrown_init(owner: Address) {
    const __code = Cell.fromHex('b5ee9c724102760100266e00025aff008e88f4a413f4bcf2c80bed53208e983001d072d721d200d200fa4021103450666f04f86102f862e1ed43d9010e020271020b020120030602f1bb47fed44d0d200018e5efa40fa40fa40d401d0fa40fa40fa40d430d0fa40f404f404f404d31ffa00fa00fa00d31fd200d430d0f404d31fd33ff4043011111114111111111113111111111112111157141112111311121111111211111110111111100f11100f550e8e87fa400101d1db3ce211131114111380f0401401112111311121111111211111110111111100f11100f550edb3c57105f0f6c4105001c810101250259f40c6fa192306ddf020148070902f5b1477b51343480006397be903e903e903500743e903e903e90350c343e903d013d013d0134c7fe803e803e8034c7f480350c343d0134c7f4cffd010c04444445044444444444c44444444444844455c504448444c44484444444844444440444444403c44403d543a3a1fe9000407476cf38b6cf15c417c3db10600f080004561302f1b1883b51343480006397be903e903e903500743e903e903e90350c343e903d013d013d0134c7fe803e803e8034c7f480350c343d0134c7f4cffd010c04444445044444444444c44444444444844455c504448444c44484444444844444440444444403c44403d543a3a1fe9000407476cf38b6cf1b3d5b15600f0a000a547987539802f1be11076a268690000c72f7d207d207d206a00e87d207d207d206a18687d207a027a027a02698ffd007d007d00698fe9006a18687a02698fe99ffa02180888888a0888888888898888888888890888ab8a08890889888908888889088888880888888807888807aa874743fd200080e8ed9e710889888a0889c0f0c016c1112111311121111111211111110111111100f11100f550edb3c57105f0f6c41206e92306d99206ef2d0806f2f6f0fe2206e92306dde0d013a81010b2e0259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe26902faed44d0d200018e5efa40fa40fa40d401d0fa40fa40fa40d430d0fa40f404f404f404d31ffa00fa00fa00d31fd200d430d0f404d31fd33ff4043011111114111111111113111111111112111157141112111311121111111211111110111111100f11100f550e8e87fa400101d1db3ce21115945f0f5f06e01113d70d1f0f1602f66d6d6d6d248d086001997f9a98c2eeceb340690af51bfad5888eaf062ef5db2ff5176c87377a2f535c8d0860016b070e452dbac97a7fa70d2e941cb4c969e85b481a7572f9cf81caa5056553848d08600569acbfa18155365cf3e05b6705b995dc5d7b041a5b69c0ad333f79e24e134f1c892970547000207021711011004380199162790b2345834af7c0df103a8395c83709c96c196c665f432d1c1d1b85edb001fa6d8101012282104a817c802204111504216e955b59f45a3098c801cf004133f442e2810101728210959b8f8022216e955b59f45a3098c801cf004133f442e2810101738210e0b5a28022216e955b59f45a3098c801cf004133f442e28101017482112bcfb58022216e955b59f45a3098c801cf004133f442e2810101751201f6821175b89b8022216e955b59f45a3098c801cf004133f442e2810101768211c0d2ae8022216e955b59f45a3098c801cf004133f442e28101017782120b542b0022216e955b59f45a3098c801cf004133f442e2810101788212566e3e0022216e955b59f45a3098c801cf004133f442e2810101798212a0efba80221301e6216e955b59f45a3098c801cf004133f442e28101017a8212ec09cd8022216e955b59f45a3098c801cf004133f442e28101012280647476805fc855305034cb0fcb07cb07cb0fc903111303206e953059f45a30944133f415e2810101728100967778810091c855305034cb0fcb07cb07cb0fc91401fe206e953059f45a30944133f415e2810101738100c8797a8100c3c855305034cb0fcb07cb07cb0fc9206e953059f45a30944133f415e2810101748100fa7a5301c855305034cb0fcb07cb07cb0fc9206e953059f45a30944133f415e20e11130e0d11120d0c11110c0b11100b10af109e109d109c0a1089107810671056104515000403040452f2e082218210b1e83451bae30221821037517518bae302218210fcb606f5bae3022182107362d09cba1731384003ee31d30720d70b01c30093fa40019472d7216de21232011114011115db3cf8421113111411131112111411121111111411111110111411100f11140f0e11140e0d11140d0c11140c0b11140b0a11140a091114091114080706554056145616db3c353b81121f2ca4562501baf2f481010120561a5956260167421802fe4133f40c6fa19401d70030925b6de2206ef2d0808200b637f8416f24135f0322bef2f456241113112211131112112111121111112011111110111f11100f111e0f0e111d0e0d111c0d0c111b0c0b111a0b0a11190a091118090811170807111607061115060511140504112204031121030211200201111f01111e5625db3c191a0054eda2edfb20c2039320c1079170e2923071e020c2069320c1099170e2943072db31e0c2089373db31e07002fa7f1127c0019c5717f8238208278d00a01117de0d111e0d0c111f0c0b0a111b0a09111a090811190807111807061117060511160504112604031123030211220201112101111c81010b1116c855e0db3cc90211110218561701206e953059f45930944133f413e20ea405111705041116040311150302111402011113016c1b03900f11120f061111060e11100e10ef10de10cd10bc10ab109a10891078105746504304db3c88f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb001c307502f681010b5611401459f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f5f0e21c0019723a70a8064a9049723a7148064a904e222c0019724a70a8064a9049724a7148064a904e225a70a8064a90424c0019726a7328064a9049726a71e8064a904e227a7148064a9045184a123a122a1561b691d01f45005726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0056195003726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00561701721e04de6d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0023c0018f2e246eb393226eb39170e28e1b5342216e216e5cb0935f047f9c01b301b3b092c705925b70e2e2b39170e2e30f12a1e30d22c2001f23252803fe20ab0081010b26206ef2d08056155959f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f10de5f0e25be8e3c35561625726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00e30d81010b23206ef2d0805614692021007e05206ef2d08025726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002ce5959f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f10de5f0e24be8e3d3256155004726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00e30d6922008002206ef2d0805004726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002f634216eb38eb181010b22206ef2d08056135959f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f10de5f0e23be9170e28e3c31561423726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00e30d026924007e01206ef2d08023726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0001f2246eb393226eb39170e28e1b5342216e216e5cb0935f047f9c01b301b3b092c705925b70e2e2b39170e28e4934216eb38e3f01206ef2d08023726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009131e202e30d12a12601fe20ab0005206ef2d08025726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002206ef2d0805004726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c927000601fb000190926c21e30d20c2008e3b561101726d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009130e22904fe702dc2008e8e7099530eb99221b39170e28ae830de20b3932dc2009170e28f5c05a47099530eb99226b39170e28f495370a02fa908298101012259f40c6fa192306ddf206ef2d080561381010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f10de5f0e26be915be30da4e83032149132e22a692c2e02e85370a02fa908298101012259f40c6fa192306ddf206ef2d080561381010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f10de5f0e26be8eaa2781010b2280404133f40a6fa19401d70130925b6de270216eb39630206ef2d0809131e229b9915be30d915be2a4692b01c433387288235447305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001581010b5410678040216e955b59f4593098c801cf014133f441e206a42da90806047f012d01c438387288285447305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001581010b5410768040216e955b59f4593098c801cf014133f441e206a42da908067f50562d0028000000005370696c6c6f766572205265776172640186018ebd728856145444305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00df01a12f0058000000005370696c6c6f76657220746f2043726561746f7220284e6f20456c696769626c65205573657273290038000000004c6576656c2075706772616465207375636365737366756c04fe5b1111111311111110111211100f11110f0e11100e10df551cdb3cf8421113111411131112111411121111111411111110111411100f11140f0e11140e0d11140d0c11140c0b11140b0a11140a09111409111408070655405614db3cf8238133c2531aa182015180bef2f42ec001935308bc9170e2e302398200ed762ec2006768323403ce30353c10bc70700c0b0a0908070605504e433081010b0fc855e0db3cc9103e1201111601206e953059f45930944133f413e2881113111411131112111311121111111211111110111111100f11100f10ef1d1e10bc10ab109a10891078106710561045103410236c33740044000000004c6576656c2065787069726564202d20706c65617365207570677261646503fe91269170e2f2f482089896805177a010df5e3b10ae109f108e107f106e05104e4e330e81010b0fc855e0db3cc9102f561701206e953059f45930944133f413e2517da0728803111703102f5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c9016c35360032000000004461696c7920436865636b2d696e2052657761726402b4fb00881113111411131112111311121111111211111110111111100f11100f10ef10de106d10bc10ab109a108910781056104510344130f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb003775008400000000436865636b2d696e207375636365737366756c2e20596f75722072657761726420686173206265656e2073656e7420746f20796f75722077616c6c65742e03fe31d31fd20020d70b01c30093fa40019472d7216de24330331113111411131112111411121111111411111110111411100f11140f0e11140e0d11140d0c11140c0b11140b0a11140a0911140908111408071114070611140605111405041114040311140302111402011115011116db3cf842201116db3c8130de2dc200f2f467423901fe82008a785625c20d9656258102dabb9170e2f2f4f8416f24135f03821005f5e100a18200be1221c200f2f41113112311131112112211121111112111111110112011100f111f0f0e111e0e0d111d0d0c111c0c0b111b0b0a111a0a0911190908111808071117070611160605111505041114040311230302112202011121013a02fc1120561ddb3c56218200e50d02bef2f45614f823112782015180a8f823707f53140756270706112d0605112d0556250504112f0403112e030201112f01112e55808101010ac85590509acb0f5007fa0215cb1f13cb1fcb07ca00cb1f01fa02ca00cb07c9031124031201112701206e953059f45a30944133f415e21112a43b3c005620c0019730821077359400e020c002983082180ba43b7400e0c202978218174876e800e08200de78f2f07003fe0d111d0d0c111c0c0b111b0b0a111a0a091119090811180807111707061116060511150504111404031113030201111201112081010b1120c855e0db3cc9103d0211120201111501206e953059f45930944133f413e2516ea003a472885614031111595a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016e6c3d3e002e00000000544f4e205374616b696e67204361706974616c02ccb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0088011114010a11130a0f11120f0f11110f0d11100d10cf10be106d109c108b107a103910585e244140f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb003f75002c000000005374616b696e67207375636365737366756c03fc8f7a31d33ffa00fa405133433033331113111411131112111411121111111411111110111411100f11140f0e11140e0d11140d0c11140c0b11140b0a11140a0911140908111408071114070611140605111405041114040311140302111402011115011116db3c8177a7f842561001c705f2f41115d31fd200fa4030e02167415b02f61114111511141113111511131112111511121111111511111110111511100f11150f0e11150e0d11150d0c11150c0b11150b0a11150a091115090811150807111507061115060511150504111504031115030211150201111701561601db3c8130de2dc200f2f482008a785624c20d9656248102dabb9170e2f2f4425403ec2e81010b2359f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206eb3996c21206ef2d0806f2fe030f82370547000547000207f216d6d532d0e55301114810101561b5612206e953059f45a30944133f414e281010b547fed547fed547fed547fed53fe5623c855e0db3cc902111f02561201696c430152206e953059f45930944133f413e2111aa42f6eb3923f3fe30d1118111b11180d11180d0d11120d551c4402f40f206ef2d0801115112411151114112311141113112211131112112111121111112011111110111f11100f111e0f0e111a0e0d111c0d0c111b0c0b111e0b0a11190a0911180908111708071116070611240605111d0504112204031121030211200201111f01db3c111311221113111211211112111111201111455304f22e81010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206e917f9d20206ef2d0806f2f105e5f0eb3e28f465b2d81010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f3e561f55c081010b0fc855e0db3cc9103f12206e953059f45930944133f413e20ce069696c46022a206ef2d0806f2f2bc1068e865f0f01db3c0ce30d0c47510480eda2edfb2e81010b2359f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f53bbc2009130e30d6d6d70207194205611bb8ae830925cb969484b4c02a270935301b98f485320a022a908a4248101012259f40c6fa192306ddf206ef2d080562181010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f2bc106e3025f0f5ba4e85b694903fa57115711571108a407a40f810101285621206e953059f45a30944133f414e210bd10ac109b107a109f106810571046103544300111100181010b0fc855e0db3cc9021120025230206e953059f45930944133f413e22081010b561259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f3e10df6c694a028281010b1110c855e0db3cc91301111101206e953059f45930944133f413e208a4080e81010b111dc855e0db3cc9134ff0206e953059f45930944133f413e20cdb316c6c008c268101012259f40c6fa192306ddf206ef2d080058101015336206e953059f45a30944133f414e21481010b50067f71216e955b59f4593098c801cf004133f441e201a403a413039a8ae85f0f10455f052d81010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f3e561f55c081010b0fc855e0db3cc9103f12206e953059f45930944133f413e20c4d696c039c238101012359f40c6fa192306ddf206ef2d08002a4562281010b2459f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f2bc106e3021a5f0a34365b71935304bb8ae85b32694e5003f83f3f5710571007a406a40c810101275621206e953059f45a30944133f414e210ad109c108b106a10581047103645404f301e81010b1110c855e0db3cc90211200201112001562001206e953059f45930944133f413e22081010b561259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f3e6c694f02920d112c0d81010b112dc855e0db3cc91302111f0201111101206e953059f45930944133f413e208a4080e81010b111dc855e0db3cc9134ff0206e953059f45930944133f413e20cdb316c6c00c2218101012259f40c6fa192306ddf206ef2d0802681010b22714133f40a6fa19401d70030925b6de26e8e320681010b277f71216e955b59f4593098c801cf004133f441e217810101542058206e953059f45a30944133f414e203a403069130e2a404fa0ba40aa4018101012b5612206e953059f45a30944133f414e210de10ce10be191817161514433081010b0fc855e0db3cc902111002561001206e953059f45930944133f413e22081010b2359f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2206ef2d0806f2f3e0d111c0d81010b111dc855e0db3cc9134ff06c696c52001c206e953059f45930944133f413e200821110111f11100f111e0f0e111d0e0d111c0d03111b030b111a0b0a11190a0c11180c081117080711160706111506051114050411130402111102011110010f109d02fa1113112211131112112111121111112011111110111f11100f111e0f0e111d0e0d111c0d0c111b0c0b111a0b0a11190a091118090811170807111607061115060511140504112204031121030211200201111f01111e561bdb3c56278200e50d02bef2f45621f823112582015180a8f823707f712507562d0706112b065556004e20c00196308208989680e020c0029630820afaf080e0c20296821011e1a300e08200de78f2f07001fa05112b0556230504112e0403112c030201112e01112c55808101010ac85590509acb0f5007fa0215cb1f13cb1fcb07ca00cb1f01fa02ca00cb07c9031121031201112601206e953059f45a30944133f415e2111fa40d111b0d0c111a0c0b11190b0a11180a0911170908111608071115070611140605111305041112045704fe031120030201111f01111d81010b111dc855e0db3cc9103b102f01111501206e953059f45930944133f413e2035614a01110a4821005f5e10072706d82084c4b4088d0103403111a03561851384133c8556082100f8a7ea55008cb1f16cb3f5004fa0258cf1601cf16f40001fa0201cf16c92c031117015a6d6d40037fc8896c58595a00300000000055534454205374616b696e67204361706974616c00016001a2cf16ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001113071112070b11110b0b11100b10af109e108d102c106b105a1049103805446743007504e68210653755ceba8fe131d30f01311112111311121111111211111110111111100f11100f10ef10de10cd10bc10ab109a10891078106710561045103411144130db3cf8421114111511141113111411131112111311121111111211111110111111100f11100f550edb3ce0218210f579295fba675d755c04948fbf31fa40d30f5932820087a4f84252f0c705f2f4011114011115db3c1113111511131112111411121111111311111110111211100f11110f0e11100e551ddb3ce0218210c83f56c2ba675d756602d21113111511131112111411121111111511111110111411100f11150f0e11140e0d11150d0c11140c0b11150b0a11140a09111509081114080711150706111406051115050411140403111503021114020111150111145615db3c22810101562559f40d6fa192306ddf685e01fc206e92306d8e1bd0d30ffa00d31fd31fd307d200d31ffa00d200d30755906c1a6f0ae2813f47216eb3f2f4206ef2d0806f2a8200ddf222f2f4f8235304a182015180a9048200d42a21c200f2f456258101012959f40d6fa192306ddf206e92306d9fd0d30fd307d307d30f55306c146f04e2206ef2d0806f246c3152b0a85f03e4812710a90401a82082084c4b40a120c2008ebc7288563355205a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009130e25398a05220be923508e30d5134a0108a107910361059103410394a0a8101010b6061640026000000005374616b696e67205265776172647302c426933538278f5a3132208ec572885630544b305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00112128a111211120e30d70111fa501112101111f10484014e2636201f2821005f5e10072706d82084c4b4088d02e03563503563603c8556082100f8a7ea55008cb1f16cb3f5004fa0258cf1601cf16f40001fa0201cf16c9562a55205a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00112028a1630034000000005374616b696e67204361706974616c20526566756e6402fcc85590509acb0f5007fa0215cb1f13cb1fcb07ca00cb1f01fa02ca00cb07c9103501112601206e953059f45a30944133f415e210de10ce10be10ae109e108e107e106e105e104e103e4e0081010b0fc855e0db3cc9103e1201111701206e953059f45930944133f413e2111315a01111111311111110111211100f11110f6c6500320e11100e10df10ce10bd109b108a107910681057061035440304d48fdf31d30fd2005932011114011115db3cf8421113111411131112111411121111111411111110111411100f11140f0e11140e0d11140d0c11140c0b11140b0a11140a09111409111408070655405614db3c22810101562759f40d6fa192306ddfe0218210e3b5e901ba67686a6e000e814d5025b3f2f4015881010b2e0259f40b6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe28134d9216eb3f2f4206ef2d0806f2f69005e20d70b01c30093fa40019472d7216de201d307d307d30fd31fd31fd31fd31ffa00d200d31fd30ff404f404d30f55e001e6206e92306d8e1bd0d30ffa00d31fd31fd307d200d31ffa00d200d30755906c1a6f0ae28200e786216eb39b21206ef2d0806f2a195f099170e2f2f4206ef2d0806f2a3403112d03810101112ec85590509acb0f5007fa0215cb1f13cb1fcb07ca00cb1f01fa02ca00cb07c902112502011126016b03ca206e953059f45a30944133f415e2550c112281010b1124c855e0db3cc9103c0211160201111401206e953059f45930944133f413e2881111111411111110111311100f11120f0e11110e0d11100d10cf10be1d109c108b107a1069105810471036102510236c6d74006250fe206e9430cf848092cf16e21ccb071acb0718cb0f16cb1f14cb1f12cb1fcb1f01fa02ca00cb1fcb0ff40012f400cb0f0046000000004175746f2d72657374616b6520707265666572656e6365207570646174656404e28f5c31d307fa005932011114011115db3c81010120104d130211170201111601216e955b59f45a3098c801cf004133f442e21111111311111110111211100f11110f0e11100e10df10ce10bd10ac0b108a10791068105710461035443012e0218210a4e0c362bae302218210bd834305ba73756f7002a831fa4001311112111311121111111211111110111111100f11100f10ef10de10cd10bc10ab109a10891078106710561045103411144130db3c3e1112111311121111111211111110111111100f11100f10ef550c737504d68f5631fa4001311112111311121111111211111110111111100f11100f10ef10de10cd10bc10ab109a10891078106710561045103411144130db3c3d1112111311121111111211111110111111100f11100f10ef10de550be0218210946a98b6bae302018210819dbe99ba7375717201d231d33f0131c8018210aff90f5758cb1fcb3fc91112111411121111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035443012f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb007502ce8f5dd33ffa405932011114011115db3c57135613011115011114c8598210327b2b4a5003cb1fcb3f01cf16c91113111411131111111311111110111211100f11110f0e11100e10df10ce10bd10ac109b108a10791068105710461035443012e05f0f5f06f2c08273740014f842561401c705f2e0840146f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb007500c4c87f01ca001114111311121111111055e0011114011113cf16011111cf16500fcf16c8500ecf16500ccf16500acf16c85009cf1617f40015f40013f400cb1f01fa0201fa0201fa0212cb1f12ca0003c8f40014cb1f15cb3f13f40012cdcdcdc9ed5430801290');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initTonCrown_init_args({ $$type: 'TonCrown_init_args', owner })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const TonCrown_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    4639: { message: "Must upgrade sequentially" },
    12510: { message: "VIP status required for staking" },
    13250: { message: "Already checked in today" },
    13529: { message: "User not registered. Please upgrade a level or stake first." },
    16199: { message: "No such stake found" },
    19792: { message: "Contract is paused" },
    30631: { message: "Notification from unknown jetton wallet" },
    34724: { message: "Not authorized to distribute rewards" },
    35448: { message: "Invalid staking duration" },
    46647: { message: "Insufficient payment" },
    48658: { message: "Insufficient value for staking" },
    54314: { message: "No rewards to claim yet" },
    56818: { message: "Stake is not active" },
    56952: { message: "Invalid VIP Class" },
    58637: { message: "Stake amount is below the minimum for your VIP level" },
    59270: { message: "No active stake" },
    60790: { message: "Must have an active level to check in" },
} as const

export const TonCrown_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "Must upgrade sequentially": 4639,
    "VIP status required for staking": 12510,
    "Already checked in today": 13250,
    "User not registered. Please upgrade a level or stake first.": 13529,
    "No such stake found": 16199,
    "Contract is paused": 19792,
    "Notification from unknown jetton wallet": 30631,
    "Not authorized to distribute rewards": 34724,
    "Invalid staking duration": 35448,
    "Insufficient payment": 46647,
    "Insufficient value for staking": 48658,
    "No rewards to claim yet": 54314,
    "Stake is not active": 56818,
    "Invalid VIP Class": 56952,
    "Stake amount is below the minimum for your VIP level": 58637,
    "No active stake": 59270,
    "Must have an active level to check in": 60790,
} as const

const TonCrown_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ChangeOwner","header":2174598809,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ChangeOwnerOk","header":846932810,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"StakeInfo","header":null,"fields":[{"name":"stakeId","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"startTime","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"duration","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"vipClass","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"autoRestake","type":{"kind":"simple","type":"bool","optional":false}},{"name":"lastClaim","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalClaimed","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"isActive","type":{"kind":"simple","type":"bool","optional":false}},{"name":"stakedAsset","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"User","header":null,"fields":[{"name":"referrer","type":{"kind":"simple","type":"address","optional":true}},{"name":"level","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"vipClass","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"directReferrals","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"totalReferrals","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"otherReferrals","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"lastCheckIn","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"levelExpiration","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalEarned","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"isActive","type":{"kind":"simple","type":"bool","optional":false}},{"name":"registrationTime","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"stakeCounter","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"stakes","type":{"kind":"dict","key":"int","value":"StakeInfo","valueFormat":"ref"}},{"name":"downlines","type":{"kind":"dict","key":"int","value":"address"}},{"name":"spilloverIndex","type":{"kind":"simple","type":"uint","optional":false,"format":16}}]},
    {"name":"VipConfig","header":null,"fields":[{"name":"dailyRoi","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"minLevel","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"maxLevel","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"stakingRoi","type":{"kind":"simple","type":"uint","optional":false,"format":16}}]},
    {"name":"PlatformStats","header":null,"fields":[{"name":"totalUsers","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalStakedTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalStakedUsdt","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalDistributed","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"activeStakes","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
    {"name":"UpgradeLevel","header":2984784977,"fields":[{"name":"targetLevel","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"referrerAddress","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"CheckIn","header":928085272,"fields":[]},
    {"name":"StakeTON","header":4239787765,"fields":[{"name":"duration","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"autoRestake","type":{"kind":"simple","type":"bool","optional":false}},{"name":"referrerAddress","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"ClaimStakingRewards","header":1698125262,"fields":[{"name":"stakeId","type":{"kind":"simple","type":"uint","optional":false,"format":16}}]},
    {"name":"UpdateAutoRestake","header":3359594178,"fields":[{"name":"stakeId","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"autoRestake","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"StakeUsdtPayload","header":null,"fields":[{"name":"duration","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"autoRestake","type":{"kind":"simple","type":"bool","optional":false}},{"name":"referrerAddress","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"JettonTransferNotification","header":1935855772,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"JettonTransfer","header":260734629,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"response_destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"custom_payload","type":{"kind":"simple","type":"cell","optional":true}},{"name":"forward_ton_amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forward_payload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"DistributeDailyRewards","header":4118358367,"fields":[{"name":"user","type":{"kind":"simple","type":"address","optional":false}},{"name":"stakeId","type":{"kind":"simple","type":"uint","optional":false,"format":16}}]},
    {"name":"UpdateLevelCost","header":3820349697,"fields":[{"name":"level","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"cost","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"SetUsdtJettonWallet","header":2766193506,"fields":[{"name":"wallet","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"SetDistributor","header":3179496197,"fields":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"TonCrown$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"creatorWallet1","type":{"kind":"simple","type":"address","optional":false}},{"name":"creatorWallet2","type":{"kind":"simple","type":"address","optional":false}},{"name":"creatorWallet3","type":{"kind":"simple","type":"address","optional":false}},{"name":"creatorWallet4","type":{"kind":"simple","type":"address","optional":false}},{"name":"usdtJettonWalletAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"distributorAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"users","type":{"kind":"dict","key":"address","value":"User","valueFormat":"ref"}},{"name":"levelCosts","type":{"kind":"dict","key":"int","value":"int"}},{"name":"vipConfigs","type":{"kind":"dict","key":"int","value":"VipConfig","valueFormat":"ref"}},{"name":"totalUsers","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalStakedTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalStakedUsdt","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalDistributed","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"activeStakes","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"isPaused","type":{"kind":"simple","type":"bool","optional":false}},{"name":"userList","type":{"kind":"dict","key":"int","value":"address"}},{"name":"spilloverRecipientIndex","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"spilloverCycle","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"userLastCycle","type":{"kind":"dict","key":"address","value":"uint","valueFormat":64}}]},
]

const TonCrown_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "ChangeOwner": 2174598809,
    "ChangeOwnerOk": 846932810,
    "UpgradeLevel": 2984784977,
    "CheckIn": 928085272,
    "StakeTON": 4239787765,
    "ClaimStakingRewards": 1698125262,
    "UpdateAutoRestake": 3359594178,
    "JettonTransferNotification": 1935855772,
    "JettonTransfer": 260734629,
    "DistributeDailyRewards": 4118358367,
    "UpdateLevelCost": 3820349697,
    "SetUsdtJettonWallet": 2766193506,
    "SetDistributor": 3179496197,
}

const TonCrown_getters: ABIGetter[] = [
    {"name":"getUserInfo","methodId":115232,"arguments":[{"name":"user","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"User","optional":true}},
    {"name":"getPlatformStats","methodId":87584,"arguments":[],"returnType":{"kind":"simple","type":"PlatformStats","optional":false}},
    {"name":"getUserAddressByIndex","methodId":78975,"arguments":[{"name":"index","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"address","optional":true}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const TonCrown_getterMapping: { [key: string]: string } = {
    'getUserInfo': 'getGetUserInfo',
    'getPlatformStats': 'getGetPlatformStats',
    'getUserAddressByIndex': 'getGetUserAddressByIndex',
    'owner': 'getOwner',
}

const TonCrown_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"UpgradeLevel"}},
    {"receiver":"internal","message":{"kind":"typed","type":"CheckIn"}},
    {"receiver":"internal","message":{"kind":"typed","type":"StakeTON"}},
    {"receiver":"internal","message":{"kind":"typed","type":"JettonTransferNotification"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ClaimStakingRewards"}},
    {"receiver":"internal","message":{"kind":"typed","type":"DistributeDailyRewards"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UpdateAutoRestake"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UpdateLevelCost"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetUsdtJettonWallet"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetDistributor"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deploy"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ChangeOwner"}},
]


export class TonCrown implements Contract {
    
    public static readonly DAILY_CHECKIN_REWARD = 10000000n;
    public static readonly LEVEL1_DURATION = 2592000n;
    public static readonly MIN_STAKE_DURATION = 14n;
    public static readonly MAX_STAKE_DURATION = 730n;
    public static readonly MAX_DIRECT_REFERRALS = 6n;
    public static readonly SECONDS_PER_DAY = 86400n;
    public static readonly ASSET_TON = 0n;
    public static readonly ASSET_USDT = 1n;
    public static readonly DISTRIBUTION_GAS_FEE = 5000000n;
    public static readonly storageReserve = 0n;
    public static readonly errors = TonCrown_errors_backward;
    public static readonly opcodes = TonCrown_opcodes;
    
    static async init(owner: Address) {
        return await TonCrown_init(owner);
    }
    
    static async fromInit(owner: Address) {
        const __gen_init = await TonCrown_init(owner);
        const address = contractAddress(0, __gen_init);
        return new TonCrown(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new TonCrown(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  TonCrown_types,
        getters: TonCrown_getters,
        receivers: TonCrown_receivers,
        errors: TonCrown_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: UpgradeLevel | CheckIn | StakeTON | JettonTransferNotification | ClaimStakingRewards | DistributeDailyRewards | UpdateAutoRestake | UpdateLevelCost | SetUsdtJettonWallet | SetDistributor | Deploy | ChangeOwner) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpgradeLevel') {
            body = beginCell().store(storeUpgradeLevel(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CheckIn') {
            body = beginCell().store(storeCheckIn(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'StakeTON') {
            body = beginCell().store(storeStakeTON(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JettonTransferNotification') {
            body = beginCell().store(storeJettonTransferNotification(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ClaimStakingRewards') {
            body = beginCell().store(storeClaimStakingRewards(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'DistributeDailyRewards') {
            body = beginCell().store(storeDistributeDailyRewards(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpdateAutoRestake') {
            body = beginCell().store(storeUpdateAutoRestake(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpdateLevelCost') {
            body = beginCell().store(storeUpdateLevelCost(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetUsdtJettonWallet') {
            body = beginCell().store(storeSetUsdtJettonWallet(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetDistributor') {
            body = beginCell().store(storeSetDistributor(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ChangeOwner') {
            body = beginCell().store(storeChangeOwner(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetUserInfo(provider: ContractProvider, user: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(user);
        const source = (await provider.get('getUserInfo', builder.build())).stack;
        const result_p = source.readTupleOpt();
        const result = result_p ? loadTupleUser(result_p) : null;
        return result;
    }
    
    async getGetPlatformStats(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('getPlatformStats', builder.build())).stack;
        const result = loadGetterTuplePlatformStats(source);
        return result;
    }
    
    async getGetUserAddressByIndex(provider: ContractProvider, index: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(index);
        const source = (await provider.get('getUserAddressByIndex', builder.build())).stack;
        const result = source.readAddressOpt();
        return result;
    }
    
    async getOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
}