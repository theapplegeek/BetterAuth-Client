export type NavItem =
  | {
  id: string;
  type: 'link';
  label: string;
  route: string | any[];
  icon?: string; // optional (or store SVG/component ref)
  roles?: string[];
}
  | {
  id: string;
  type: 'group';
  label: string;
  icon?: string;
  roles?: string[];
  children: Array<{
    id: string;
    label: string;
    route: string | any[];
    roles?: string[];
  }>;
};
