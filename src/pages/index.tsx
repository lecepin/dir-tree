import { useMemo, useState } from "react";
import {
  Divider,
  Input,
  Button,
  Modal,
  message,
  Form,
  InputNumber,
  Switch,
} from "antd";
import { CopyOutlined, SettingOutlined } from "@ant-design/icons";

import "./index.less";

export default function Home() {
  const [visibleSetting, setVisibleSetting] = useState(false);
  const [fileObj, setFileObj] = useState<ISCanFile | null>(null);
  const [setting, setSetting] = useState({
    deep: 3,
    iconDir: "📁",
    iconFile: "📄",
  });
  const [form] = Form.useForm();
  const showIconValue = Form.useWatch("showIcon", form);
  const content = useMemo(() => {
    if (!fileObj) {
      return "";
    }

    console.log(fileObj.children);

    function getStr(
      list: Array<ISCanFile>,
      deep: number,
      currentDeep: number,
      prefix: string
    ) {
      return list
        .map((item, index) => {
          if (index === list.length - 1) {
            const childStr = getStr(
              item.children || [],
              deep,
              currentDeep + 1,
              prefix + " ".repeat(3)
            );

            return prefix + "└─ " + item.name + "\r" + childStr;
          } else {
            const childStr = getStr(
              item.children || [],
              deep,
              currentDeep + 1,
              prefix + "│" + " ".repeat(2)
            );

            return prefix + "├─ " + item.name + "\r" + childStr;
          }
        })
        .join("");
    }

    return (
      fileObj.name + "\r" + getStr(fileObj.children || [], setting.deep, 0, "")
    );
  }, [fileObj, setting]);
  const resultKey = useMemo(() => {
    return Date.now();
  }, [content]);

  return (
    <div className="app">
      <div
        className="drop-box"
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => {
          e.preventDefault();
          (e.target as HTMLDivElement).classList.add("drop-box-enter");
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          (e.target as HTMLDivElement).classList.remove("drop-box-enter");
        }}
        onDrop={async (e) => {
          e.preventDefault();
          const items = e.dataTransfer.items;

          if (items.length == 0) {
            return;
          }

          console.time("scanFiles");
          try {
            setFileObj(await scanFiles(items[0].webkitGetAsEntry()));
          } catch (error) {
            message.error(error);
          }
          console.timeEnd("scanFiles");

          function scanFiles(item: FileSystemEntry | null): Promise<ISCanFile> {
            if (!item) {
              return Promise.reject("item is null");
            }

            const obj: ISCanFile = {
              name: item.name,
              isFile: item.isFile,
            };

            if (item.isDirectory) {
              obj.children = [];
              return new Promise((resolve) => {
                (item as FileSystemDirectoryEntry)
                  .createReader()
                  .readEntries(async (entries) => {
                    return Promise.all(
                      entries.map((entry) => {
                        return scanFiles(entry).then((result) =>
                          obj.children!.push(result)
                        );
                      })
                    ).then(() => {
                      resolve(obj);
                    });
                  });
              });
            } else {
              return new Promise((resolve, reject) => {
                (item as FileSystemFileEntry).file(resolve, reject);
              })
                .then((file: File) => {
                  obj.size = file.size;
                })
                .then(() => obj);
            }
          }
        }}
      >
        请将目录拖拽至此
      </div>
      <Divider />
      {fileObj ? (
        <Input.TextArea
          key={resultKey}
          className="result"
          rows={10}
          placeholder=""
          defaultValue={content}
        />
      ) : null}
      <div className="bottom-btn">
        {fileObj ? (
          <Button
            type="primary"
            icon={<CopyOutlined />}
            size="large"
            ghost
            onClick={() => {
              (
                document.querySelector(".result")! as HTMLTextAreaElement
              ).select();
              document.execCommand("copy");
              message.success("已复制", 1);
            }}
          >
            复制
          </Button>
        ) : null}

        <Button
          type="primary"
          icon={<SettingOutlined />}
          size="large"
          ghost
          danger
          onClick={() => setVisibleSetting(true)}
        >
          设置
        </Button>
      </div>

      {visibleSetting ? (
        <Modal
          title="设置"
          open
          onOk={async () => {
            console.log(await form.validateFields());
          }}
          onCancel={() => setVisibleSetting(false)}
        >
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            form={form}
            initialValues={setting}
          >
            <Form.Item
              name="deep"
              label="目录显示深度"
              rules={[{ required: true }]}
            >
              <InputNumber />
            </Form.Item>
            <Form.Item name="showIcon" label="显现图标" valuePropName="checked">
              <Switch />
            </Form.Item>
            {showIconValue ? (
              <>
                <Form.Item
                  name="iconDir"
                  label="目录图标"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="iconFile"
                  label="文件图标"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </>
            ) : null}
          </Form>
        </Modal>
      ) : null}
    </div>
  );
}
