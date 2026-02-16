export type NavItem = {
  id: string;
  type: 'link' | 'group';
  label: string;
  route?: string;
  exact?: boolean;
  icon?: string;
  roles?: string[];
  children?: Array<{
    id: string;
    label: string;
    route?: string;
    exact?: boolean;
    icon?: string;
    roles?: string[];
  }>;
};
