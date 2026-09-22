import { type Config } from 'tailwindcss';

const tailwindConfig: Config = {
    content: ['./src/**/*.{html,scss,ts}'],
    theme: {
        extend: {
            screens: {
                mob: { min: '1px', max: '700px' },
                tab: { min: '700px', max: '1279px' },
                desk: { min: '1279px' },
            },
            fontFamily: {
                sans: ['Varela', 'system-ui', 'sans-serif'],
            },
            colors: {
                ink: {
                    DEFAULT: '#24272C',
                },
                accent: {
                    DEFAULT: '#0072F5',
                },
                primary: {
                    DEFAULT: '#0F172A',
                },
                muted: {
                    DEFAULT: '#666666',
                },
                green: {
                    DEFAULT: '#10B981',
                },
                amber: {
                    DEFAULT: '#F59E0B',
                },
                red: {
                    DEFAULT: '#EF4444',
                },
                'text-primary': '#F4F4F8',
                'text-secondary': '#C4C4D8',
                'text-dim': '#7878A0',
                subtle: '#333345',
                'full-white': '#FFFFFF',
                white: {
                    DEFAULT: '#F9FAFB',
                },
            },
            spacing: {
                '5px': '5px',
                '15px': '15px',
                '30px': '30px',
                '35px': '35px',
                '50px': '50px',
            },
            fontSize: {
                title: [
                    '10px',
                    {
                        lineHeight: '14px',
                        fontWeight: '400',
                    },
                ],
                'span-12': [
                    '12px',
                    {
                        lineHeight: '21px',
                        fontWeight: '400',
                    },
                ],
                span: [
                    '14px',
                    {
                        lineHeight: '21px',
                        fontWeight: '400',
                    },
                ],

                h3: [
                    '25px',
                    {
                        lineHeight: '27px',
                        fontWeight: '500',
                    },
                ],
                h5: [
                    '16px',
                    {
                        lineHeight: '24px',
                        fontWeight: '400',
                    },
                ],
            },
            borderRadius: {
                '4px': '4px',
                '5px': '5px',
                '10px': '10px',
                '15px': '15px',
                '25px': '25px',
            },
            borderWidth: {
                '2px': '2px',
            },
        },
    },
    plugins: [],
};

export default tailwindConfig;
