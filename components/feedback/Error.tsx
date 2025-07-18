interface ErrorProps {
    message: string;
}

const Error = ({ message }: ErrorProps) => {
    return <div>Error: {message}</div>;
};

export default Error;
