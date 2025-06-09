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

export type User = {
    $$type: 'User';
    address: Address;
    referrer: Address | null;
    level: bigint;
    vipClass: bigint;
    directReferrals: bigint;
    totalReferrals: bigint;
    lastCheckIn: bigint;
    levelExpiration: bigint;
    totalEarned: bigint;
    pendingRewards: bigint;
    isActive: boolean;
    registrationTime: bigint;
}

export function storeUser(src: User) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.address);
        b_0.storeAddress(src.referrer);
        b_0.storeUint(src.level, 8);
        b_0.storeUint(src.vipClass, 8);
        b_0.storeUint(src.directReferrals, 16);
        b_0.storeUint(src.totalReferrals, 32);
        b_0.storeUint(src.lastCheckIn, 32);
        b_0.storeUint(src.levelExpiration, 32);
        b_0.storeCoins(src.totalEarned);
        b_0.storeCoins(src.pendingRewards);
        b_0.storeBit(src.isActive);
        b_0.storeUint(src.registrationTime, 32);
    };
}

export function loadUser(slice: Slice) {
    const sc_0 = slice;
    const _address = sc_0.loadAddress();
    const _referrer = sc_0.loadMaybeAddress();
    const _level = sc_0.loadUintBig(8);
    const _vipClass = sc_0.loadUintBig(8);
    const _directReferrals = sc_0.loadUintBig(16);
    const _totalReferrals = sc_0.loadUintBig(32);
    const _lastCheckIn = sc_0.loadUintBig(32);
    const _levelExpiration = sc_0.loadUintBig(32);
    const _totalEarned = sc_0.loadCoins();
    const _pendingRewards = sc_0.loadCoins();
    const _isActive = sc_0.loadBit();
    const _registrationTime = sc_0.loadUintBig(32);
    return { $$type: 'User' as const, address: _address, referrer: _referrer, level: _level, vipClass: _vipClass, directReferrals: _directReferrals, totalReferrals: _totalReferrals, lastCheckIn: _lastCheckIn, levelExpiration: _levelExpiration, totalEarned: _totalEarned, pendingRewards: _pendingRewards, isActive: _isActive, registrationTime: _registrationTime };
}

export function loadTupleUser(source: TupleReader) {
    const _address = source.readAddress();
    const _referrer = source.readAddressOpt();
    const _level = source.readBigNumber();
    const _vipClass = source.readBigNumber();
    const _directReferrals = source.readBigNumber();
    const _totalReferrals = source.readBigNumber();
    const _lastCheckIn = source.readBigNumber();
    const _levelExpiration = source.readBigNumber();
    const _totalEarned = source.readBigNumber();
    const _pendingRewards = source.readBigNumber();
    const _isActive = source.readBoolean();
    const _registrationTime = source.readBigNumber();
    return { $$type: 'User' as const, address: _address, referrer: _referrer, level: _level, vipClass: _vipClass, directReferrals: _directReferrals, totalReferrals: _totalReferrals, lastCheckIn: _lastCheckIn, levelExpiration: _levelExpiration, totalEarned: _totalEarned, pendingRewards: _pendingRewards, isActive: _isActive, registrationTime: _registrationTime };
}

export function loadGetterTupleUser(source: TupleReader) {
    const _address = source.readAddress();
    const _referrer = source.readAddressOpt();
    const _level = source.readBigNumber();
    const _vipClass = source.readBigNumber();
    const _directReferrals = source.readBigNumber();
    const _totalReferrals = source.readBigNumber();
    const _lastCheckIn = source.readBigNumber();
    const _levelExpiration = source.readBigNumber();
    const _totalEarned = source.readBigNumber();
    const _pendingRewards = source.readBigNumber();
    const _isActive = source.readBoolean();
    const _registrationTime = source.readBigNumber();
    return { $$type: 'User' as const, address: _address, referrer: _referrer, level: _level, vipClass: _vipClass, directReferrals: _directReferrals, totalReferrals: _totalReferrals, lastCheckIn: _lastCheckIn, levelExpiration: _levelExpiration, totalEarned: _totalEarned, pendingRewards: _pendingRewards, isActive: _isActive, registrationTime: _registrationTime };
}

export function storeTupleUser(source: User) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.address);
    builder.writeAddress(source.referrer);
    builder.writeNumber(source.level);
    builder.writeNumber(source.vipClass);
    builder.writeNumber(source.directReferrals);
    builder.writeNumber(source.totalReferrals);
    builder.writeNumber(source.lastCheckIn);
    builder.writeNumber(source.levelExpiration);
    builder.writeNumber(source.totalEarned);
    builder.writeNumber(source.pendingRewards);
    builder.writeBoolean(source.isActive);
    builder.writeNumber(source.registrationTime);
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

export type StakeInfo = {
    $$type: 'StakeInfo';
    amount: bigint;
    startTime: bigint;
    duration: bigint;
    vipClass: bigint;
    autoRestake: boolean;
    lastClaim: bigint;
    totalClaimed: bigint;
    isActive: boolean;
}

export function storeStakeInfo(src: StakeInfo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.amount);
        b_0.storeUint(src.startTime, 32);
        b_0.storeUint(src.duration, 32);
        b_0.storeUint(src.vipClass, 8);
        b_0.storeBit(src.autoRestake);
        b_0.storeUint(src.lastClaim, 32);
        b_0.storeCoins(src.totalClaimed);
        b_0.storeBit(src.isActive);
    };
}

export function loadStakeInfo(slice: Slice) {
    const sc_0 = slice;
    const _amount = sc_0.loadCoins();
    const _startTime = sc_0.loadUintBig(32);
    const _duration = sc_0.loadUintBig(32);
    const _vipClass = sc_0.loadUintBig(8);
    const _autoRestake = sc_0.loadBit();
    const _lastClaim = sc_0.loadUintBig(32);
    const _totalClaimed = sc_0.loadCoins();
    const _isActive = sc_0.loadBit();
    return { $$type: 'StakeInfo' as const, amount: _amount, startTime: _startTime, duration: _duration, vipClass: _vipClass, autoRestake: _autoRestake, lastClaim: _lastClaim, totalClaimed: _totalClaimed, isActive: _isActive };
}

export function loadTupleStakeInfo(source: TupleReader) {
    const _amount = source.readBigNumber();
    const _startTime = source.readBigNumber();
    const _duration = source.readBigNumber();
    const _vipClass = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    const _lastClaim = source.readBigNumber();
    const _totalClaimed = source.readBigNumber();
    const _isActive = source.readBoolean();
    return { $$type: 'StakeInfo' as const, amount: _amount, startTime: _startTime, duration: _duration, vipClass: _vipClass, autoRestake: _autoRestake, lastClaim: _lastClaim, totalClaimed: _totalClaimed, isActive: _isActive };
}

export function loadGetterTupleStakeInfo(source: TupleReader) {
    const _amount = source.readBigNumber();
    const _startTime = source.readBigNumber();
    const _duration = source.readBigNumber();
    const _vipClass = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    const _lastClaim = source.readBigNumber();
    const _totalClaimed = source.readBigNumber();
    const _isActive = source.readBoolean();
    return { $$type: 'StakeInfo' as const, amount: _amount, startTime: _startTime, duration: _duration, vipClass: _vipClass, autoRestake: _autoRestake, lastClaim: _lastClaim, totalClaimed: _totalClaimed, isActive: _isActive };
}

export function storeTupleStakeInfo(source: StakeInfo) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.amount);
    builder.writeNumber(source.startTime);
    builder.writeNumber(source.duration);
    builder.writeNumber(source.vipClass);
    builder.writeBoolean(source.autoRestake);
    builder.writeNumber(source.lastClaim);
    builder.writeNumber(source.totalClaimed);
    builder.writeBoolean(source.isActive);
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

export type ReferralNode = {
    $$type: 'ReferralNode';
    referrer: Address;
    referralIndex: bigint;
    depth: bigint;
}

export function storeReferralNode(src: ReferralNode) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.referrer);
        b_0.storeUint(src.referralIndex, 8);
        b_0.storeUint(src.depth, 8);
    };
}

export function loadReferralNode(slice: Slice) {
    const sc_0 = slice;
    const _referrer = sc_0.loadAddress();
    const _referralIndex = sc_0.loadUintBig(8);
    const _depth = sc_0.loadUintBig(8);
    return { $$type: 'ReferralNode' as const, referrer: _referrer, referralIndex: _referralIndex, depth: _depth };
}

export function loadTupleReferralNode(source: TupleReader) {
    const _referrer = source.readAddress();
    const _referralIndex = source.readBigNumber();
    const _depth = source.readBigNumber();
    return { $$type: 'ReferralNode' as const, referrer: _referrer, referralIndex: _referralIndex, depth: _depth };
}

export function loadGetterTupleReferralNode(source: TupleReader) {
    const _referrer = source.readAddress();
    const _referralIndex = source.readBigNumber();
    const _depth = source.readBigNumber();
    return { $$type: 'ReferralNode' as const, referrer: _referrer, referralIndex: _referralIndex, depth: _depth };
}

export function storeTupleReferralNode(source: ReferralNode) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.referrer);
    builder.writeNumber(source.referralIndex);
    builder.writeNumber(source.depth);
    return builder.build();
}

export function dictValueParserReferralNode(): DictionaryValue<ReferralNode> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeReferralNode(src)).endCell());
        },
        parse: (src) => {
            return loadReferralNode(src.loadRef().beginParse());
        }
    }
}

export type PlatformStats = {
    $$type: 'PlatformStats';
    totalUsers: bigint;
    totalStaked: bigint;
    totalDistributed: bigint;
    activeStakes: bigint;
}

export function storePlatformStats(src: PlatformStats) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.totalUsers, 32);
        b_0.storeCoins(src.totalStaked);
        b_0.storeCoins(src.totalDistributed);
        b_0.storeUint(src.activeStakes, 32);
    };
}

export function loadPlatformStats(slice: Slice) {
    const sc_0 = slice;
    const _totalUsers = sc_0.loadUintBig(32);
    const _totalStaked = sc_0.loadCoins();
    const _totalDistributed = sc_0.loadCoins();
    const _activeStakes = sc_0.loadUintBig(32);
    return { $$type: 'PlatformStats' as const, totalUsers: _totalUsers, totalStaked: _totalStaked, totalDistributed: _totalDistributed, activeStakes: _activeStakes };
}

export function loadTuplePlatformStats(source: TupleReader) {
    const _totalUsers = source.readBigNumber();
    const _totalStaked = source.readBigNumber();
    const _totalDistributed = source.readBigNumber();
    const _activeStakes = source.readBigNumber();
    return { $$type: 'PlatformStats' as const, totalUsers: _totalUsers, totalStaked: _totalStaked, totalDistributed: _totalDistributed, activeStakes: _activeStakes };
}

export function loadGetterTuplePlatformStats(source: TupleReader) {
    const _totalUsers = source.readBigNumber();
    const _totalStaked = source.readBigNumber();
    const _totalDistributed = source.readBigNumber();
    const _activeStakes = source.readBigNumber();
    return { $$type: 'PlatformStats' as const, totalUsers: _totalUsers, totalStaked: _totalStaked, totalDistributed: _totalDistributed, activeStakes: _activeStakes };
}

export function storeTuplePlatformStats(source: PlatformStats) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.totalUsers);
    builder.writeNumber(source.totalStaked);
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

export type Register = {
    $$type: 'Register';
    referrerAddress: Address | null;
}

export function storeRegister(src: Register) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4151013294, 32);
        b_0.storeAddress(src.referrerAddress);
    };
}

export function loadRegister(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4151013294) { throw Error('Invalid prefix'); }
    const _referrerAddress = sc_0.loadMaybeAddress();
    return { $$type: 'Register' as const, referrerAddress: _referrerAddress };
}

export function loadTupleRegister(source: TupleReader) {
    const _referrerAddress = source.readAddressOpt();
    return { $$type: 'Register' as const, referrerAddress: _referrerAddress };
}

export function loadGetterTupleRegister(source: TupleReader) {
    const _referrerAddress = source.readAddressOpt();
    return { $$type: 'Register' as const, referrerAddress: _referrerAddress };
}

export function storeTupleRegister(source: Register) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.referrerAddress);
    return builder.build();
}

export function dictValueParserRegister(): DictionaryValue<Register> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRegister(src)).endCell());
        },
        parse: (src) => {
            return loadRegister(src.loadRef().beginParse());
        }
    }
}

export type UpgradeLevel = {
    $$type: 'UpgradeLevel';
    targetLevel: bigint;
}

export function storeUpgradeLevel(src: UpgradeLevel) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(984679371, 32);
        b_0.storeUint(src.targetLevel, 8);
    };
}

export function loadUpgradeLevel(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 984679371) { throw Error('Invalid prefix'); }
    const _targetLevel = sc_0.loadUintBig(8);
    return { $$type: 'UpgradeLevel' as const, targetLevel: _targetLevel };
}

export function loadTupleUpgradeLevel(source: TupleReader) {
    const _targetLevel = source.readBigNumber();
    return { $$type: 'UpgradeLevel' as const, targetLevel: _targetLevel };
}

export function loadGetterTupleUpgradeLevel(source: TupleReader) {
    const _targetLevel = source.readBigNumber();
    return { $$type: 'UpgradeLevel' as const, targetLevel: _targetLevel };
}

export function storeTupleUpgradeLevel(source: UpgradeLevel) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.targetLevel);
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
}

export function storeStakeTON(src: StakeTON) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4233037804, 32);
        b_0.storeUint(src.duration, 32);
        b_0.storeBit(src.autoRestake);
    };
}

export function loadStakeTON(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4233037804) { throw Error('Invalid prefix'); }
    const _duration = sc_0.loadUintBig(32);
    const _autoRestake = sc_0.loadBit();
    return { $$type: 'StakeTON' as const, duration: _duration, autoRestake: _autoRestake };
}

export function loadTupleStakeTON(source: TupleReader) {
    const _duration = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    return { $$type: 'StakeTON' as const, duration: _duration, autoRestake: _autoRestake };
}

export function loadGetterTupleStakeTON(source: TupleReader) {
    const _duration = source.readBigNumber();
    const _autoRestake = source.readBoolean();
    return { $$type: 'StakeTON' as const, duration: _duration, autoRestake: _autoRestake };
}

export function storeTupleStakeTON(source: StakeTON) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.duration);
    builder.writeBoolean(source.autoRestake);
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
}

export function storeClaimStakingRewards(src: ClaimStakingRewards) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3410432642, 32);
    };
}

export function loadClaimStakingRewards(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3410432642) { throw Error('Invalid prefix'); }
    return { $$type: 'ClaimStakingRewards' as const };
}

export function loadTupleClaimStakingRewards(source: TupleReader) {
    return { $$type: 'ClaimStakingRewards' as const };
}

export function loadGetterTupleClaimStakingRewards(source: TupleReader) {
    return { $$type: 'ClaimStakingRewards' as const };
}

export function storeTupleClaimStakingRewards(source: ClaimStakingRewards) {
    const builder = new TupleBuilder();
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

export type UnstakeTON = {
    $$type: 'UnstakeTON';
}

export function storeUnstakeTON(src: UnstakeTON) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2691902268, 32);
    };
}

export function loadUnstakeTON(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2691902268) { throw Error('Invalid prefix'); }
    return { $$type: 'UnstakeTON' as const };
}

export function loadTupleUnstakeTON(source: TupleReader) {
    return { $$type: 'UnstakeTON' as const };
}

export function loadGetterTupleUnstakeTON(source: TupleReader) {
    return { $$type: 'UnstakeTON' as const };
}

export function storeTupleUnstakeTON(source: UnstakeTON) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserUnstakeTON(): DictionaryValue<UnstakeTON> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUnstakeTON(src)).endCell());
        },
        parse: (src) => {
            return loadUnstakeTON(src.loadRef().beginParse());
        }
    }
}

export type ClaimPendingRewards = {
    $$type: 'ClaimPendingRewards';
}

export function storeClaimPendingRewards(src: ClaimPendingRewards) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3861925051, 32);
    };
}

export function loadClaimPendingRewards(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3861925051) { throw Error('Invalid prefix'); }
    return { $$type: 'ClaimPendingRewards' as const };
}

export function loadTupleClaimPendingRewards(source: TupleReader) {
    return { $$type: 'ClaimPendingRewards' as const };
}

export function loadGetterTupleClaimPendingRewards(source: TupleReader) {
    return { $$type: 'ClaimPendingRewards' as const };
}

export function storeTupleClaimPendingRewards(source: ClaimPendingRewards) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserClaimPendingRewards(): DictionaryValue<ClaimPendingRewards> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeClaimPendingRewards(src)).endCell());
        },
        parse: (src) => {
            return loadClaimPendingRewards(src.loadRef().beginParse());
        }
    }
}

export type SetCreatorWallet = {
    $$type: 'SetCreatorWallet';
    walletId: bigint;
    address: Address;
}

export function storeSetCreatorWallet(src: SetCreatorWallet) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(454567065, 32);
        b_0.storeUint(src.walletId, 8);
        b_0.storeAddress(src.address);
    };
}

export function loadSetCreatorWallet(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 454567065) { throw Error('Invalid prefix'); }
    const _walletId = sc_0.loadUintBig(8);
    const _address = sc_0.loadAddress();
    return { $$type: 'SetCreatorWallet' as const, walletId: _walletId, address: _address };
}

export function loadTupleSetCreatorWallet(source: TupleReader) {
    const _walletId = source.readBigNumber();
    const _address = source.readAddress();
    return { $$type: 'SetCreatorWallet' as const, walletId: _walletId, address: _address };
}

export function loadGetterTupleSetCreatorWallet(source: TupleReader) {
    const _walletId = source.readBigNumber();
    const _address = source.readAddress();
    return { $$type: 'SetCreatorWallet' as const, walletId: _walletId, address: _address };
}

export function storeTupleSetCreatorWallet(source: SetCreatorWallet) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.walletId);
    builder.writeAddress(source.address);
    return builder.build();
}

export function dictValueParserSetCreatorWallet(): DictionaryValue<SetCreatorWallet> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetCreatorWallet(src)).endCell());
        },
        parse: (src) => {
            return loadSetCreatorWallet(src.loadRef().beginParse());
        }
    }
}

export type UpdateVipConfig = {
    $$type: 'UpdateVipConfig';
    vipClass: bigint;
    config: VipConfig;
}

export function storeUpdateVipConfig(src: UpdateVipConfig) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(112629374, 32);
        b_0.storeUint(src.vipClass, 8);
        b_0.store(storeVipConfig(src.config));
    };
}

export function loadUpdateVipConfig(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 112629374) { throw Error('Invalid prefix'); }
    const _vipClass = sc_0.loadUintBig(8);
    const _config = loadVipConfig(sc_0);
    return { $$type: 'UpdateVipConfig' as const, vipClass: _vipClass, config: _config };
}

export function loadTupleUpdateVipConfig(source: TupleReader) {
    const _vipClass = source.readBigNumber();
    const _config = loadTupleVipConfig(source);
    return { $$type: 'UpdateVipConfig' as const, vipClass: _vipClass, config: _config };
}

export function loadGetterTupleUpdateVipConfig(source: TupleReader) {
    const _vipClass = source.readBigNumber();
    const _config = loadGetterTupleVipConfig(source);
    return { $$type: 'UpdateVipConfig' as const, vipClass: _vipClass, config: _config };
}

export function storeTupleUpdateVipConfig(source: UpdateVipConfig) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.vipClass);
    builder.writeTuple(storeTupleVipConfig(source.config));
    return builder.build();
}

export function dictValueParserUpdateVipConfig(): DictionaryValue<UpdateVipConfig> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUpdateVipConfig(src)).endCell());
        },
        parse: (src) => {
            return loadUpdateVipConfig(src.loadRef().beginParse());
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

export type EmergencyPause = {
    $$type: 'EmergencyPause';
    paused: boolean;
}

export function storeEmergencyPause(src: EmergencyPause) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1064338113, 32);
        b_0.storeBit(src.paused);
    };
}

export function loadEmergencyPause(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1064338113) { throw Error('Invalid prefix'); }
    const _paused = sc_0.loadBit();
    return { $$type: 'EmergencyPause' as const, paused: _paused };
}

export function loadTupleEmergencyPause(source: TupleReader) {
    const _paused = source.readBoolean();
    return { $$type: 'EmergencyPause' as const, paused: _paused };
}

export function loadGetterTupleEmergencyPause(source: TupleReader) {
    const _paused = source.readBoolean();
    return { $$type: 'EmergencyPause' as const, paused: _paused };
}

export function storeTupleEmergencyPause(source: EmergencyPause) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.paused);
    return builder.build();
}

export function dictValueParserEmergencyPause(): DictionaryValue<EmergencyPause> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeEmergencyPause(src)).endCell());
        },
        parse: (src) => {
            return loadEmergencyPause(src.loadRef().beginParse());
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
    users: Dictionary<Address, User>;
    stakes: Dictionary<Address, StakeInfo>;
    referralNodes: Dictionary<Address, ReferralNode>;
    levelCosts: Dictionary<bigint, bigint>;
    vipConfigs: Dictionary<bigint, VipConfig>;
    totalUsers: bigint;
    totalStaked: bigint;
    totalDistributed: bigint;
    activeStakes: bigint;
    isPaused: boolean;
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
        b_1.storeDict(src.users, Dictionary.Keys.Address(), dictValueParserUser());
        b_1.storeDict(src.stakes, Dictionary.Keys.Address(), dictValueParserStakeInfo());
        b_1.storeDict(src.referralNodes, Dictionary.Keys.Address(), dictValueParserReferralNode());
        const b_2 = new Builder();
        b_2.storeDict(src.levelCosts, Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257));
        b_2.storeDict(src.vipConfigs, Dictionary.Keys.BigInt(257), dictValueParserVipConfig());
        b_2.storeUint(src.totalUsers, 32);
        b_2.storeCoins(src.totalStaked);
        b_2.storeCoins(src.totalDistributed);
        b_2.storeUint(src.activeStakes, 32);
        b_2.storeBit(src.isPaused);
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
    const _users = Dictionary.load(Dictionary.Keys.Address(), dictValueParserUser(), sc_1);
    const _stakes = Dictionary.load(Dictionary.Keys.Address(), dictValueParserStakeInfo(), sc_1);
    const _referralNodes = Dictionary.load(Dictionary.Keys.Address(), dictValueParserReferralNode(), sc_1);
    const sc_2 = sc_1.loadRef().beginParse();
    const _levelCosts = Dictionary.load(Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257), sc_2);
    const _vipConfigs = Dictionary.load(Dictionary.Keys.BigInt(257), dictValueParserVipConfig(), sc_2);
    const _totalUsers = sc_2.loadUintBig(32);
    const _totalStaked = sc_2.loadCoins();
    const _totalDistributed = sc_2.loadCoins();
    const _activeStakes = sc_2.loadUintBig(32);
    const _isPaused = sc_2.loadBit();
    return { $$type: 'TonCrown$Data' as const, owner: _owner, creatorWallet1: _creatorWallet1, creatorWallet2: _creatorWallet2, creatorWallet3: _creatorWallet3, creatorWallet4: _creatorWallet4, users: _users, stakes: _stakes, referralNodes: _referralNodes, levelCosts: _levelCosts, vipConfigs: _vipConfigs, totalUsers: _totalUsers, totalStaked: _totalStaked, totalDistributed: _totalDistributed, activeStakes: _activeStakes, isPaused: _isPaused };
}

export function loadTupleTonCrown$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _creatorWallet1 = source.readAddress();
    const _creatorWallet2 = source.readAddress();
    const _creatorWallet3 = source.readAddress();
    const _creatorWallet4 = source.readAddress();
    const _users = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserUser(), source.readCellOpt());
    const _stakes = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserStakeInfo(), source.readCellOpt());
    const _referralNodes = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserReferralNode(), source.readCellOpt());
    const _levelCosts = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _vipConfigs = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserVipConfig(), source.readCellOpt());
    const _totalUsers = source.readBigNumber();
    const _totalStaked = source.readBigNumber();
    const _totalDistributed = source.readBigNumber();
    const _activeStakes = source.readBigNumber();
    const _isPaused = source.readBoolean();
    return { $$type: 'TonCrown$Data' as const, owner: _owner, creatorWallet1: _creatorWallet1, creatorWallet2: _creatorWallet2, creatorWallet3: _creatorWallet3, creatorWallet4: _creatorWallet4, users: _users, stakes: _stakes, referralNodes: _referralNodes, levelCosts: _levelCosts, vipConfigs: _vipConfigs, totalUsers: _totalUsers, totalStaked: _totalStaked, totalDistributed: _totalDistributed, activeStakes: _activeStakes, isPaused: _isPaused };
}

export function loadGetterTupleTonCrown$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _creatorWallet1 = source.readAddress();
    const _creatorWallet2 = source.readAddress();
    const _creatorWallet3 = source.readAddress();
    const _creatorWallet4 = source.readAddress();
    const _users = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserUser(), source.readCellOpt());
    const _stakes = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserStakeInfo(), source.readCellOpt());
    const _referralNodes = Dictionary.loadDirect(Dictionary.Keys.Address(), dictValueParserReferralNode(), source.readCellOpt());
    const _levelCosts = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _vipConfigs = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserVipConfig(), source.readCellOpt());
    const _totalUsers = source.readBigNumber();
    const _totalStaked = source.readBigNumber();
    const _totalDistributed = source.readBigNumber();
    const _activeStakes = source.readBigNumber();
    const _isPaused = source.readBoolean();
    return { $$type: 'TonCrown$Data' as const, owner: _owner, creatorWallet1: _creatorWallet1, creatorWallet2: _creatorWallet2, creatorWallet3: _creatorWallet3, creatorWallet4: _creatorWallet4, users: _users, stakes: _stakes, referralNodes: _referralNodes, levelCosts: _levelCosts, vipConfigs: _vipConfigs, totalUsers: _totalUsers, totalStaked: _totalStaked, totalDistributed: _totalDistributed, activeStakes: _activeStakes, isPaused: _isPaused };
}

export function storeTupleTonCrown$Data(source: TonCrown$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeAddress(source.creatorWallet1);
    builder.writeAddress(source.creatorWallet2);
    builder.writeAddress(source.creatorWallet3);
    builder.writeAddress(source.creatorWallet4);
    builder.writeCell(source.users.size > 0 ? beginCell().storeDictDirect(source.users, Dictionary.Keys.Address(), dictValueParserUser()).endCell() : null);
    builder.writeCell(source.stakes.size > 0 ? beginCell().storeDictDirect(source.stakes, Dictionary.Keys.Address(), dictValueParserStakeInfo()).endCell() : null);
    builder.writeCell(source.referralNodes.size > 0 ? beginCell().storeDictDirect(source.referralNodes, Dictionary.Keys.Address(), dictValueParserReferralNode()).endCell() : null);
    builder.writeCell(source.levelCosts.size > 0 ? beginCell().storeDictDirect(source.levelCosts, Dictionary.Keys.BigInt(257), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.vipConfigs.size > 0 ? beginCell().storeDictDirect(source.vipConfigs, Dictionary.Keys.BigInt(257), dictValueParserVipConfig()).endCell() : null);
    builder.writeNumber(source.totalUsers);
    builder.writeNumber(source.totalStaked);
    builder.writeNumber(source.totalDistributed);
    builder.writeNumber(source.activeStakes);
    builder.writeBoolean(source.isPaused);
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
    const __code = Cell.fromHex('b5ee9c7241027601001f27000228ff008e88f4a413f4bcf2c80bed5320e303ed43d9011f02016202030105a000b7380201200414020120050a0202710608028eabd8ed44d0d200018e2dfa40fa40fa40d401d0fa40fa40f404f404f404d430d0f404f404d31ffa00fa00d31fd2003010cf10ce10cd6c1f8e87fa400101d1db3ce2550edb3c6cf12007002c810101530850334133f40c6fa19401d70030925b6de202baaba4ed44d0d200018e2dfa40fa40fa40d401d0fa40fa40f404f404f404d430d0f404f404d31ffa00fa00d31fd2003010cf10ce10cd6c1f8e87fa400101d1db3ce2550edb3c6cf1206e92306d99206ef2d0806f246f04e2206e92306dde20090048810101270259f40d6fa192306ddf206e92306d9fd0d30fd307d307d30f55306c146f04e20201200b120201200c110201660d0f0289a63bda89a1a400031c5bf481f481f481a803a1f481f481e809e809e809a861a1e809e809a63ff401f401a63fa40060219e219c219ad83f1d0ff4800203a3b679c5b678d9e3200e00022e028da779da89a1a400031c5bf481f481f481a803a1f481f481e809e809e809a861a1e809e809a63ff401f401a63fa40060219e219c219ad83f1d0ff4800203a3b679c4aa1db678d9e32010004aeda2edfb20c00192302de020c00294302cdb31e020c00394302bdb31e0c004932adb31e06d028bb1883b5134348000638b7e903e903e903500743e903e903d013d013d01350c343d013d0134c7fe803e8034c7f4800c0433c43384335b07e3a1fe9000407476cf38b6cf1b3d20207002bbb6927da89a1a400031c5bf481f481f481a803a1f481f481e809e809e809a861a1e809e809a63ff401f401a63fa40060219e219c219ad83f1d0ff4800203a3b679c4aa1db678d9e240dd2460db3240dde5a100de46de07c440dd2460dbbd02013004481010b290259f40b6fa192306ddf206e92306d9dd0fa40d307d30755206c136f03e2020120151a02016e1618028badc276a268690000c716fd207d207d206a00e87d207d207a027a027a026a18687a027a02698ffd007d00698fe90018086788670866b60fc743fd200080e8ed9e716d9e3678c020170008f8276f1002bbae5976a268690000c716fd207d207d206a00e87d207d207a027a027a026a18687a027a02698ffd007d00698fe90018086788670866b60fc743fd200080e8ed9e712a876d9e36789037491836cc903779684037943784711037491836ef402019005a81010b2a0259f40b6fa192306ddf206e92306d8e17d0fa00d31fd31fd307d200d31ffa00d20055706c186f08e20201201b1d02bbb4441da89a1a400031c5bf481f481f481a803a1f481f481e809e809e809a861a1e809e809a63ff401f401a63fa40060219e219c219ad83f1d0ff4800203a3b679c4aa1db678d9e240dd2460db3240dde5a100de58de19c440dd2460dbbd0201c013a81010b2b0259f40b6fa192306ddf206e92306d8e87d0db3c6c1c6f0ce255028bb59bdda89a1a400031c5bf481f481f481a803a1f481f481e809e809e809a861a1e809e809a63ff401f401a63fa40060219e219c219ad83f1d0ff4800203a3b679c5b678d9e30201e00022003da30eda2edfb01d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e2dfa40fa40fa40d401d0fa40fa40f404f404f404d430d0f404f404d31ffa00fa00d31fd2003010cf10ce10cd6c1f8e87fa400101d1db3ce21110935f0f30e02ed749c21fe3000ef9012020266a02f66d6d6d6d6d8d086007e2dbaddbc876deeed64b893e05583fe06671dadb166b33feaeea4558c4686d348d08600569acbfa18155365cf3e05b6705b995dc5d7b041a5b69c0ad333f79e24e134f1c8d08600366321627cc276153037ce4aef6f15512c238b8db5500e012775bbe44a8c1779c89705470007081010171212200438008a0d9747589a63738f6c352e5d297f8df27cc0bae9b02fdb8d159134e10116cf001f8820afaf08022104e216e955b59f45a3098c801cf004133f442e281010172821005f5e10022216e955b59f45a3098c801cf004133f442e28101017382100bebc20022216e955b59f45a3098c801cf004133f442e28101017482101dcd650022216e955b59f45a3098c801cf004133f442e28101017582103b9aca00222301ea216e955b59f45a3098c801cf004133f442e28101017682107735940022216e955b59f45a3098c801cf004133f442e28101017782112a05f20022216e955b59f45a3098c801cf004133f442e2810101788212540be40022216e955b59f45a3098c801cf004133f442e281010179821804a817c800222401fe216e955b59f45a3098c801cf004133f442e28101017a82180ba43b740022216e955b59f45a3098c801cf004133f442e281010171806474768032c855305034cb0fcb07cb07cb0fc9103c206e953059f45a30944133f415e28101017281009677788064c855305034cb0fcb07cb07cb0fc9206e953059f45a30944133f415e22500b6810101738100c8797a22c855305034cb0fcb07cb07cb0fc9206e953059f45a30944133f415e2810101748100fa7a5301c855305034cb0fcb07cb07cb0fc9206e953059f45a30944133f415e2108d107c106b105a1089107810670504520ed31f218210f76b6faebae3022182103ab103cbbae30221821037517518bae302218210e6304cbbba272e474e04e43120d70b01c30093fa40019472d7216de23110de10cd10bc10ab109a108910781067105610451034413fdb3cf842817d4d2b81010b2359f40b6fa192306ddf206e92306d8e87d0db3c6c1c6f0ce26ef2f4f82370547000547000207f2a0a561b559055a081010b0cc855b0db3cc922103d015f55502803d4206e953059f45930944133f413e205a456106eb38eb71110206ef2d0800f11100f10ef10de10cd10bc105b109a1089107810671056104510344130db3c0e0d0c0b0a0910481047104610455520923a3fe28810ef10de10cd10bc10ab104a108910781067105610344130292c2d04f42b81010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1c6f0ce2206e917f9c20206ef2d0806f2c1b5f0bb3e28f485b2a81010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1c6f0ce2206ef2d0806f2c3a561610ab558081010b0cc855b0db3cc9103c12206e953059f45930944133f413e209e05555502a03ae206ef2d0806f2c27c1068f485f0d2a81010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1c6f0ce2206ef2d0806f2c3a561610ab558081010b0cc855b0db3cc9103c12206e953059f45930944133f413e2e30d0955502b019807a406a453c6715981010b03c855205acf1612cb07cb07c90311170341f0206e953059f45930944133f413e21056105c111481010b0dc855b0db3cc9103c206e953059f45930944133f413e250003600000000526567697374726174696f6e207375636365737366756c00cef8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055e050fecf16500ccf16500acf16c85009cf165007cf1615f40013f400f40001c8f40012f40012cb1f5003fa025003fa0214cb1f12ca0012cdcdc9ed54db3103f831d307013110de10cd10bc10ab109a108910781067105610451034413fdb3cf84255e02fdb3c313781121f08a4561b01ba18f2f4813223561ac20094561ac10b9170e2f2f481010120561159561c014133f40c6fa19401d70030925b6de28116e0216eb3f2f48200b637f8416f24135f0322206ef2d080bef2f4561a5f542f02fa0e11190e0d11180d0c11170c0b11160b0a11150a0911140908111308071112070611110605111005104f0311190302111802011117011116561bdb3c7f111dc0019c571af8238208278d00a0111ade0911160981010b56160a09111909102807111407061113060511120504111c0403111b030211160201111e01111530310064eda2edfb20c2039320c1079170e2923071e020c2069320c1099170e2943072db31e020c20892c10b923070e29373db31e07004a8c855b0db3cc91201111301561201206e953059f45930944133f413e22d206ef2d08005111005104f103e102d0c11120c1b0a11120a102807111207102605111205102403111203011111db3c2f6eb3923f3fe30d50323f4403f621a70a8064a90422a7148064a90423a7148064a90404a71e8064a904728856120345555a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb007288561355205a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016e33343500220000000043726561746f7220736861726500240000000057616c6c6574203120736861726503feb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00728856110345555a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0081010b2c0259f40b6fa192306ddf206e92306d8e87d0db3c6c1c6f0ce2206ef2d0806f2c10ab5f0b36553700240000000057616c6c657420322073686172650298206eb38e88206ef2d08071db3c8ebc3072882d55205a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00e2383e03b620c20a917f9322c000e2925f03e02c81010b2359f40b6fa192306ddf206e92306d8e87d0db3c6c1c6f0ce2206e917f9c20206ef2d0806f2c1b5f0bb3e2e30221c1079723a7328064a9049723a7198064a904e220c200925f05e30d55393b017a5f0372882d55205a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb003a006600000000556e7175616c69666965642075706c696e652072657761726420666f72206175746f20646973747269627574696f6e03f8728856115443305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0001206ef2d0806f2c513ca02a10ac09108c07106c05104c413381010b0dc855b0db3cc90311100315206e953059f45930944133f413e2226eb3933d5f03e30d3c503d004e0000000055706c696e652072657761726420666f72206175746f20646973747269627574696f6e001c503da101206ef2d08002a412f05b0060000000004f727068616e65642075706c696e652072657761726420666f72206175746f20646973747269627574696f6e01661110206ef2d080a7198064a9040f206ef2d0800e11100e10df10ce10bd10ac109b108a107910681057104610354430db3c55c14003e22b81010b2259f40b6fa192306ddf206e92306d8e87d0db3c6c1c6f0ce2206eb39b20206ef2d0806f2c1b5f0b9170e28ebd5b72882d55205a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0009e30d09554142006800000000556e7175616c696669656420726566657272657220626f6e757320666f72206175746f20646973747269627574696f6e02c272882f5445305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00206ef2d0806f2c503da00281010b0dc855b0db3cc9103c206e953059f45930944133f413e24350005a000000004c6576656c2072656e6577616c20626f6e757320666f72206175746f20646973747269627574696f6e02fe8810df10ce10bd10ac109b108a10791068105710461035443012f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055e050fecf16500ccf16500acf16c85009cf165007cf1615f40013f400f40001c8f40012f40012cb1f5003fa025003fa0214cb1f12ca0012cdcdc9ed5445460038000000004c6576656c2075706772616465207375636365737366756c0004db31047c5b10ce551bdb3cf84255e02fdb3cf8238133c25317a182015180bef2f42ac001935305bc9170e2e302368200e37e2ac20091229170e2f2f48208989680725f54484a03cc303138108910797070557081010b0cc855b0db3cc9103b1201111101206e953059f45930944133f413e28810ef10de10cd10bc1a1b1089107810671056104510341023f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb005049690044000000004c6576656c2065787069726564202d20706c65617365207570677261646504fc88561955205a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00038208989680a010ab109b108b107b106b105b104b103b5981010b0cc855b0db3cc9103b1201111101206e953059f45930944133f413e2018208989680a08810ef10de4b504c4d005e000000004461696c7920636865636b2d696e2072657761726420666f72206175746f20646973747269627574696f6e002e00000000436865636b2d696e207375636365737366756c00f810cd10bc10ab102a10891078106710561045134440f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055e050fecf16500ccf16500acf16c85009cf165007cf1615f40013f400f40001c8f40012f40012cb1f5003fa025003fa0214cb1f12ca0012cdcdc9ed54db31043ce302218210fc4f07ecbae302218210cb471282bae302218210a0732b3cba4f53595d048e5b10ce551bdb3cf84255e02fdb3c8200d24323c200f2f4109b5e37106a105b104a103b4ab070500c81010b0dc855b0db3cc9103c01111201206e953059f45930944133f413e2725f545051005650cbcf165009206e9430cf848092cf16e217cb0715cb0713cb0fcb1fcb1fcb1f01fa0201fa0212ca00cb1f0290882c031112595a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010de10cd10bc10ab109a55075269006200000000436c61696d65642070656e64696e67207265776172647320666f72206175746f20646973747269627574696f6e03f431d31fd200593211101fdb3cf84255e02fdb3c108b5f0b8130de21c200f2f482008a785613c20d9656138102dabb9170e2f2f482009063f8416f24135f0382103b9aca00bef2f42981010b561259f40b6fa192306ddf206e92306d8e17d0fa00d31fd31fd307d200d31ffa00d20055706c186f08e2817161216e5f5456015a81010b2b0259f40b6fa192306ddf206e92306d8e87d0db3c6c1c6f0ce28200e03e216eb3f2f4206ef2d0806f2c550052fa4020d70b01c30093fa40019472d7216de201d307d307d30fd31fd31fd31ffa00fa00d200d31f55b002fe92317f9b01206ef2d0806f286c71b3e2f2f4f8416f24135f03f823111482015180a8f823102504111504433001111401707f556081010b08c855705087fa0215cb1f13cb1fcb07ca00cb1f58fa02ca00c9103841f0206e953059f45930944133f413e2f8416f24135f0316a00da48810cf10be10ad109c108b107a106910585758002c000000005374616b696e67207375636365737366756c00de1047103641501413f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055e050fecf16500ccf16500acf16c85009cf165007cf1615f40013f400f40001c8f40012f40012cb1f5003fa025003fa0214cb1f12ca0012cdcdc9ed54db3102e05b10ce551bdb3cf8422981010b2259f40b6fa192306ddf206e92306d8e17d0fa00d31fd31fd307d200d31ffa00d20055706c186f08e28200e786216eb3f2f4206ef2d0806f288200ddf221f2f4f8235303a182015180a9048200d42a21c200f2f456108101012859f40d6fa192306ddf5f5a01fe206e92306d9fd0d30fd307d307d30f55306c146f04e2816dc1216eb3f2f4206ef2d0806f246c3152a0a8812710a90401a85387a05220be8e1625933437269f6c2127a07051d8a10ba50b50dd0307e2923407e25123a01068102510481023487081010b08c855705087fa0215cb1f13cb1fcb07ca00cb1f58fa02ca00c9103c5b02a041c0206e953059f45930944133f413e272882d544c305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb005039a0025c690052000000005374616b696e67207265776172647320666f72206175746f20646973747269627574696f6e04c2e3022182101b182499ba8f4c31d307fa40593211101fdb3c5610c001923d3f8e325610c002923c3f8e245610c003923b3f8e161110c0049139983e816c17f2f0108de2108e109d1089e210ad109ae210bd10abe210ce551ae021821006b6967eba5e6b696303fe5b10ce551bdb3cf8422981010b2259f40b6fa192306ddf206e92306d8e17d0fa00d31fd31fd307d200d31ffa00d20055706c186f08e28200e786216eb3f2f4206ef2d0806f28812bd701f2f4f82322a182015180a9045370c2009131e30d7028555281010b08c855705087fa0215cb1f13cb1fcb07ca00cb1f58fa02ca00c95f6061000e814d5021b3f2f400822f8101012759f40d6fa192306ddf206e92306d9fd0d30fd307d307d30f55306c146f04e2206eb38e14206ef2d0806f246c315290a8812710a90458a8a0923031e202a8103d4140206e953059f45930944133f413e2505aa102a572882d0347775a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00136269005400000000556e7374616b696e672072657475726e20666f72206175746f20646973747269627574696f6e03fe8f7531d307d30fd307d307d30f55301045350e11110e0d11100d10cf0b11110b0a11100a109f0811110807111007106f0511110504111004103f02111102011112011113db3c8200944b5610c200945610c1059170e2f2f4021111020111120111138101011111c855305034cb0fcb07cb07cb0fc94ed0e0218210e3b5e9016b646500cc206e953059f45a30944133f415e2109e108d107c106b105a10491038471550330604c87f01ca0055e050fecf16500ccf16500acf16c85009cf165007cf1615f40013f400f40001c8f40012f40012cb1f5003fa025003fa0214cb1f12ca0012cdcdc9ed54db3104e6ba8f5d31d307fa00593211101fdb3c8132235611c200945611c10b9170e2f2f48200f20a5610c200f2f4810101201048130211120201111101216e955b59f45a3098c801cf004133f442e210ce10bd10ac109b108a1079106810570610354430e02182103f7082c1bae302218210946a98b6ba6b69666701cc31d200013110de10cd10bc10ab109a108910781067105610451034413fdb3c30550dc87f01ca0055e050fecf16500ccf16500acf16c85009cf165007cf1615f40013f400f40001c8f40012f40012cb1f5003fa025003fa0214cb1f12ca0012cdcdc9ed54db316b02b88ece31d33f0131c8018210aff90f5758cb1fcb3fc910df10ce10bd10ac109b108a107910681057104610354430f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00e0018210819dbe99bae3020e696802b6d33ffa40593211101fdb3c3e51fec8598210327b2b4a5003cb1fcb3f01cf16c910ef10ce10bd10ac109b108a107910681057104610354430f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb006b690088c87f01ca0055e050fecf16500ccf16500acf16c85009cf165007cf1615f40013f400f40001c8f40012f40012cb1f5003fa025003fa0214cb1f12ca0012cdcdc9ed54db3104d882f0158e394e7cc73a9aeb362957fe037665588aef16f3bd68580c13ab84097cf22aba8fc63010ce551bdb3c7081008288561155205a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00e06b6c6d6e0012f84252f0c705f2e084003000000000456d657267656e6379207769746864726177616c0084c87f01ca0055e050fecf16500ccf16500acf16c85009cf165007cf1615f40013f400f40001c8f40012f40012cb1f5003fa025003fa0214cb1f12ca0012cdcdc9ed54015482f08bab7bd9df7d417259df0dc41b0ffffd3925f5b462183ef6fdea533df98eb0a0bae3025f0ff2c0826f04a610ce551bdb3c30c86f00016f8c6d6f8c8b755736572733a208db3c038e22c821c10098802d01cb0701a301de019a7aa90ca630541220c000e63068a592cb07e4da11c9d013db3c8ba2c205374616b65643a2087073737100085474322404d2db3c018e22c821c10098802d01cb0701a301de019a7aa90ca630541220c000e63068a592cb07e4da11c9d0db3c8bf2c2044697374726962757465643a208db3c018e22c821c10098802d01cb0701a301de019a7aa90ca630541220c000e63068a592cb07e4da11c9d07373737202f6db3c6f2201c993216eb396016f2259ccc9e831d0db3cf8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055e050fecf16500ccf16500acf16c85009cf165007cf1615f40013f400f40001c8f40012f40012cb1f5003fa025003fa0214cb1f12ca0012cdcdc9ed5473740104db3c750142c87001cb1f6f00016f8c6d6f8c01db3c6f2201c993216eb396016f2259ccc9e8317500ba20d74a21d7499720c20022c200b18e4a036f22807f22cf31ab02a105ab025155b60820c2009c20aa0215d7185033cf164014de596f025341a1c20099c8016f025044a1aa028e123133c20099d430d020d74a21d749927020e2e2e85f03f4457430');
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
    5856: { message: "Level cost not configured" },
    11223: { message: "Stake already inactive" },
    12510: { message: "VIP status required for staking" },
    12835: { message: "Invalid level" },
    13250: { message: "Already checked in today" },
    19792: { message: "Contract is paused" },
    27671: { message: "Invalid wallet ID (1-4 only)" },
    28097: { message: "VIP config not found" },
    29025: { message: "Already have active stake" },
    32077: { message: "User already registered" },
    35448: { message: "Invalid staking duration" },
    36963: { message: "Minimum stake is 1 TON" },
    37963: { message: "Invalid VIP class" },
    46647: { message: "Insufficient payment" },
    53827: { message: "No pending rewards" },
    54314: { message: "No rewards to claim yet" },
    56818: { message: "Stake is not active" },
    57406: { message: "User not registered" },
    58238: { message: "Must have active level to check in" },
    59270: { message: "No active stake" },
    61962: { message: "Cost must be positive" },
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
    "Level cost not configured": 5856,
    "Stake already inactive": 11223,
    "VIP status required for staking": 12510,
    "Invalid level": 12835,
    "Already checked in today": 13250,
    "Contract is paused": 19792,
    "Invalid wallet ID (1-4 only)": 27671,
    "VIP config not found": 28097,
    "Already have active stake": 29025,
    "User already registered": 32077,
    "Invalid staking duration": 35448,
    "Minimum stake is 1 TON": 36963,
    "Invalid VIP class": 37963,
    "Insufficient payment": 46647,
    "No pending rewards": 53827,
    "No rewards to claim yet": 54314,
    "Stake is not active": 56818,
    "User not registered": 57406,
    "Must have active level to check in": 58238,
    "No active stake": 59270,
    "Cost must be positive": 61962,
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
    {"name":"User","header":null,"fields":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}},{"name":"referrer","type":{"kind":"simple","type":"address","optional":true}},{"name":"level","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"vipClass","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"directReferrals","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"totalReferrals","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"lastCheckIn","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"levelExpiration","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalEarned","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"pendingRewards","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"isActive","type":{"kind":"simple","type":"bool","optional":false}},{"name":"registrationTime","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
    {"name":"StakeInfo","header":null,"fields":[{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"startTime","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"duration","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"vipClass","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"autoRestake","type":{"kind":"simple","type":"bool","optional":false}},{"name":"lastClaim","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalClaimed","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"isActive","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"VipConfig","header":null,"fields":[{"name":"dailyRoi","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"minLevel","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"maxLevel","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"stakingRoi","type":{"kind":"simple","type":"uint","optional":false,"format":16}}]},
    {"name":"ReferralNode","header":null,"fields":[{"name":"referrer","type":{"kind":"simple","type":"address","optional":false}},{"name":"referralIndex","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"depth","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"PlatformStats","header":null,"fields":[{"name":"totalUsers","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalStaked","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalDistributed","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"activeStakes","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
    {"name":"Register","header":4151013294,"fields":[{"name":"referrerAddress","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"UpgradeLevel","header":984679371,"fields":[{"name":"targetLevel","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"CheckIn","header":928085272,"fields":[]},
    {"name":"StakeTON","header":4233037804,"fields":[{"name":"duration","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"autoRestake","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"ClaimStakingRewards","header":3410432642,"fields":[]},
    {"name":"UnstakeTON","header":2691902268,"fields":[]},
    {"name":"ClaimPendingRewards","header":3861925051,"fields":[]},
    {"name":"SetCreatorWallet","header":454567065,"fields":[{"name":"walletId","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"UpdateVipConfig","header":112629374,"fields":[{"name":"vipClass","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"config","type":{"kind":"simple","type":"VipConfig","optional":false}}]},
    {"name":"UpdateLevelCost","header":3820349697,"fields":[{"name":"level","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"cost","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"EmergencyPause","header":1064338113,"fields":[{"name":"paused","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"TonCrown$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"creatorWallet1","type":{"kind":"simple","type":"address","optional":false}},{"name":"creatorWallet2","type":{"kind":"simple","type":"address","optional":false}},{"name":"creatorWallet3","type":{"kind":"simple","type":"address","optional":false}},{"name":"creatorWallet4","type":{"kind":"simple","type":"address","optional":false}},{"name":"users","type":{"kind":"dict","key":"address","value":"User","valueFormat":"ref"}},{"name":"stakes","type":{"kind":"dict","key":"address","value":"StakeInfo","valueFormat":"ref"}},{"name":"referralNodes","type":{"kind":"dict","key":"address","value":"ReferralNode","valueFormat":"ref"}},{"name":"levelCosts","type":{"kind":"dict","key":"int","value":"int"}},{"name":"vipConfigs","type":{"kind":"dict","key":"int","value":"VipConfig","valueFormat":"ref"}},{"name":"totalUsers","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalStaked","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"totalDistributed","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"activeStakes","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"isPaused","type":{"kind":"simple","type":"bool","optional":false}}]},
]

const TonCrown_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "ChangeOwner": 2174598809,
    "ChangeOwnerOk": 846932810,
    "Register": 4151013294,
    "UpgradeLevel": 984679371,
    "CheckIn": 928085272,
    "StakeTON": 4233037804,
    "ClaimStakingRewards": 3410432642,
    "UnstakeTON": 2691902268,
    "ClaimPendingRewards": 3861925051,
    "SetCreatorWallet": 454567065,
    "UpdateVipConfig": 112629374,
    "UpdateLevelCost": 3820349697,
    "EmergencyPause": 1064338113,
}

const TonCrown_getters: ABIGetter[] = [
    {"name":"getUserInfo","methodId":115232,"arguments":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"User","optional":true}},
    {"name":"getStakeInfo","methodId":113842,"arguments":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"StakeInfo","optional":true}},
    {"name":"getPlatformStats","methodId":87584,"arguments":[],"returnType":{"kind":"simple","type":"PlatformStats","optional":false}},
    {"name":"getLevelCost","methodId":68568,"arguments":[{"name":"level","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"int","optional":true,"format":257}},
    {"name":"getVipConfig","methodId":69540,"arguments":[{"name":"vipClass","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"VipConfig","optional":true}},
    {"name":"getReferralNode","methodId":95379,"arguments":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"ReferralNode","optional":true}},
    {"name":"getCreatorWallet","methodId":83900,"arguments":[{"name":"walletId","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"address","optional":true}},
    {"name":"getContractBalance","methodId":111492,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"isPaused","methodId":126174,"arguments":[],"returnType":{"kind":"simple","type":"bool","optional":false}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const TonCrown_getterMapping: { [key: string]: string } = {
    'getUserInfo': 'getGetUserInfo',
    'getStakeInfo': 'getGetStakeInfo',
    'getPlatformStats': 'getGetPlatformStats',
    'getLevelCost': 'getGetLevelCost',
    'getVipConfig': 'getGetVipConfig',
    'getReferralNode': 'getGetReferralNode',
    'getCreatorWallet': 'getGetCreatorWallet',
    'getContractBalance': 'getGetContractBalance',
    'isPaused': 'getIsPaused',
    'owner': 'getOwner',
}

const TonCrown_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"Register"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UpgradeLevel"}},
    {"receiver":"internal","message":{"kind":"typed","type":"CheckIn"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ClaimPendingRewards"}},
    {"receiver":"internal","message":{"kind":"typed","type":"StakeTON"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ClaimStakingRewards"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UnstakeTON"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetCreatorWallet"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UpdateVipConfig"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UpdateLevelCost"}},
    {"receiver":"internal","message":{"kind":"typed","type":"EmergencyPause"}},
    {"receiver":"internal","message":{"kind":"text","text":"withdraw"}},
    {"receiver":"internal","message":{"kind":"text","text":"status"}},
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
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: Register | UpgradeLevel | CheckIn | ClaimPendingRewards | StakeTON | ClaimStakingRewards | UnstakeTON | SetCreatorWallet | UpdateVipConfig | UpdateLevelCost | EmergencyPause | "withdraw" | "status" | Deploy | ChangeOwner) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Register') {
            body = beginCell().store(storeRegister(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpgradeLevel') {
            body = beginCell().store(storeUpgradeLevel(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CheckIn') {
            body = beginCell().store(storeCheckIn(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ClaimPendingRewards') {
            body = beginCell().store(storeClaimPendingRewards(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'StakeTON') {
            body = beginCell().store(storeStakeTON(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ClaimStakingRewards') {
            body = beginCell().store(storeClaimStakingRewards(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UnstakeTON') {
            body = beginCell().store(storeUnstakeTON(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetCreatorWallet') {
            body = beginCell().store(storeSetCreatorWallet(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpdateVipConfig') {
            body = beginCell().store(storeUpdateVipConfig(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpdateLevelCost') {
            body = beginCell().store(storeUpdateLevelCost(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'EmergencyPause') {
            body = beginCell().store(storeEmergencyPause(message)).endCell();
        }
        if (message === "withdraw") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (message === "status") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
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
    
    async getGetUserInfo(provider: ContractProvider, address: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(address);
        const source = (await provider.get('getUserInfo', builder.build())).stack;
        const result_p = source.readTupleOpt();
        const result = result_p ? loadTupleUser(result_p) : null;
        return result;
    }
    
    async getGetStakeInfo(provider: ContractProvider, address: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(address);
        const source = (await provider.get('getStakeInfo', builder.build())).stack;
        const result_p = source.readTupleOpt();
        const result = result_p ? loadTupleStakeInfo(result_p) : null;
        return result;
    }
    
    async getGetPlatformStats(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('getPlatformStats', builder.build())).stack;
        const result = loadGetterTuplePlatformStats(source);
        return result;
    }
    
    async getGetLevelCost(provider: ContractProvider, level: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(level);
        const source = (await provider.get('getLevelCost', builder.build())).stack;
        const result = source.readBigNumberOpt();
        return result;
    }
    
    async getGetVipConfig(provider: ContractProvider, vipClass: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(vipClass);
        const source = (await provider.get('getVipConfig', builder.build())).stack;
        const result_p = source.readTupleOpt();
        const result = result_p ? loadTupleVipConfig(result_p) : null;
        return result;
    }
    
    async getGetReferralNode(provider: ContractProvider, address: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(address);
        const source = (await provider.get('getReferralNode', builder.build())).stack;
        const result_p = source.readTupleOpt();
        const result = result_p ? loadTupleReferralNode(result_p) : null;
        return result;
    }
    
    async getGetCreatorWallet(provider: ContractProvider, walletId: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(walletId);
        const source = (await provider.get('getCreatorWallet', builder.build())).stack;
        const result = source.readAddressOpt();
        return result;
    }
    
    async getGetContractBalance(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('getContractBalance', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getIsPaused(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('isPaused', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
    async getOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
}