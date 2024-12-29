import { Slot } from '@radix-ui/react-slot';
import { useAtom } from 'jotai';
import { settingsAtom } from '~/atom';
import { Button, InputNumber, Label } from '~/components';
import { ipc } from '~/ipc';

function SettingItem(
  props: React.PropsWithChildren<{ label: React.ReactNode }>,
) {
  const { label, children } = props;

  return (
    <div className="grid grid-cols-6 items-center">
      <Label className="col-span-3">{label}</Label>
      <Slot className="col-span-3">{children}</Slot>
    </div>
  );
}

export function Settings() {
  const [settings, setSettings] = useAtom(settingsAtom);

  const handleHostsNumConfirm = (v: number) => {
    setSettings({ ...settings, hostsNumPerLine: v });
  };

  const handleHistoryNumConfirm = (v: number) => {
    setSettings({ ...settings, historyMaximumNum: v });
  };

  const handleOpenDir = () => {
    ipc.openHostsDir();
  };

  return (
    <div className="grid gap-4 py-4">
      <SettingItem label="Hosts file directory">
        <Button variant="default" onClick={handleOpenDir}>
          Open directory
        </Button>
      </SettingItem>
      <SettingItem label="Number of hosts per line">
        <InputNumber
          initValue={settings.hostsNumPerLine}
          minValue={1}
          maxValue={100}
          onConfirm={handleHostsNumConfirm}
        />
      </SettingItem>
      <SettingItem label="Maximum number of history">
        <InputNumber
          initValue={settings.historyMaximumNum}
          minValue={1}
          maxValue={500}
          onConfirm={handleHistoryNumConfirm}
        />
      </SettingItem>
    </div>
  );
}
