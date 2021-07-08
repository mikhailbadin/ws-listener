import React, { useState, useReducer } from 'react';
import { Divider, Input, Layout, List, message } from 'antd';

import { createConsumer } from "@rails/actioncable"

const { Header, Sider, Content } = Layout;
const { Search } = Input;

const Context = React.createContext({ name: 'Default' });
const defaultUrl = 'ws://0.0.0.0:3000/websocket'

const WebsocketConnector = () => {
    const [messsageApi, contextHolder] = message.useMessage();
    const [cable, setCable] = useState(null);
    const [url, setUrl] = useState(defaultUrl);
    const [messages, setMessage] = useReducer((state, action) => {
        switch (action.type) {
            case 'push':
                return [...state, JSON.stringify(action.message)];
            case 'clear':
                return [];
            default:
                return state;
        }
    }, []);
    const info = (type, msg) => {
        messsageApi.open({
            type: type,
            content: <Context.Consumer>{({ name }) => msg}</Context.Consumer>,
            duration: 2,
        });
    };

    const changeCable = (ws_token) => {
        cable && cable.subscriptions["subscriptions"].forEach(e => e.unsubscribe());
        setCable(createConsumer(`${url}?token=${ws_token}`));
    }

    const subscribeToChannel = (channelName) => {
        if (url.length === 0) {
            info("warning", "URL is not set!");
            return;
        }
        if (cable == null) {
            info("warning", "JWT token is not set!");
            return;
        }

        setMessage({ type: 'clear' })
        cable.subscriptions["subscriptions"].forEach(e => e.unsubscribe());
        cable.subscriptions.create(channelName, {
            received: (message) => setMessage({ type: 'push', message: message }),
            disconnected: () => info("error", "Disconnected"),
            connected: () => info("success", "Connected"),
        });
    }

    return (
        <Layout>
            <Context.Provider value={{ name: 'Ant Design' }}>
                {contextHolder}
            </Context.Provider>
            <Sider />
            <Layout>
                <Header />
                <Content>
                    <Search placeholder="Websocket URL" onSearch={setUrl} enterButton="Set websocket URL" defaultValue={url} />
                    <Search placeholder="JWT token" onSearch={changeCable} enterButton="Set JWT token" />
                    <Search placeholder="Channel name" onSearch={subscribeToChannel} enterButton="Subscribe to channel" />
                    <Divider type="horizontal">Messages</Divider>
                    <List
                        size="small"
                        bordered
                        dataSource={messages}
                        renderItem={item => <List.Item>{item}</List.Item>}
                    />
                </Content>
            </Layout>
            <Sider />
        </Layout>
    )
}

export default WebsocketConnector;