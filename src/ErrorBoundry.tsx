import React, { Component, ReactNode } from "react";
import { logError } from "./services/LoggerService";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    logError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong. Please download error logs.</h2>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
