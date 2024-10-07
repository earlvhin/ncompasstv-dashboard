import { ButtonGroup } from '../type/ButtonGroup';

export const CONTENT_TYPE: ButtonGroup[] = [
    {
        value: 1,
        label: 'Assigned to Dealer',
        slug: 'dealer-content',
        icon: 'fas fa-users',
        show: true,
    },
    {
        value: 2,
        label: 'Floating Contents',
        slug: 'floating-content',
        icon: 'fas fa-ghost',
        show: true,
    },
    {
        value: 3,
        label: 'Fillers',
        slug: 'filler-contents',
        icon: 'fas fa-photo-video',
        show: true,
    },
];
