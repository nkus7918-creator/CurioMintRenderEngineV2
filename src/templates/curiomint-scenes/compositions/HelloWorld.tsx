import { AbsoluteFill } from "remotion";

export type HelloWorldProps = {
  title: string;
  subtitle: string;
};

export const HelloWorld = ({
  title,
  subtitle,
}: HelloWorldProps) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: "bold",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 40,
            opacity: 0.8,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};