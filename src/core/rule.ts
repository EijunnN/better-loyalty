
export type RuleAction<P> = (payload: P, userId: string | number) => {
    points: number;
    actionName?: string;
  };
  export type RuleCondition<P> = (payload: P, userId: string | number) => boolean | Promise<boolean>;
  
  export interface Rule<P> {
    condition?: RuleCondition<P>;
    action: RuleAction<P>;
  }
  
  export type RulesConfig<T extends Record<string, unknown>> = {
    [K in keyof T]: Rule<T[K]>;
  };
  

  export function defineRules<T extends Record<string, unknown>>(config: RulesConfig<T>): RulesConfig<T> {
    return config;
  }