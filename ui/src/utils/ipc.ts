import { invoke } from '@tauri-apps/api/core';
import { IS_TAURI } from '~/consts';

const mockHosts = `




#    comment  
               
#    1.1.1.1 1.com 2.com 3.com 4.com 5.com 6.com 7.com 8.com 9.com 10.com

1.1.1.1 a.com    c.com     b.com f.com   #     ##     comment 
1.1.1.1   e.com h.com  g.com i.com  k.com j.com l.com m.com   n.c#om     ##               fejifoejfoiejfoj                                  comment 

# comment
# comment
# comment
# comment
# comment

# 1.1.1.1 11.com 12.com


           2402:1200:4f00:1234:0000:5678:9abc:def0   b.com  


4.4.4.4    
# 4.4.4.4 

#[foo]    

#[bar]
  3.3.3.3 a.com

  #   3.3.3.3 b.com
#[bar]

#[foo]      

#abcdefg

#[foo]
3.3.3.3 e.com
5.5.5.5 a.com
#[foo]

#[System]
3.3.3.3 c.com
#[System]

#[baz]
5.5.5.5 a.com

#[foo]
5.5.5.5 c.com
#[foo]
`;

export const ipc = {
  getSystemHosts(): Promise<string> {
    if (IS_TAURI) {
      return invoke('read_system_hosts');
    }
    return Promise.resolve(mockHosts);
  },

  viewGitHub(): void {
    if (IS_TAURI) {
      invoke('view_github');
    }
  },
};
