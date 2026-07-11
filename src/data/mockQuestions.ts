export const mockQuestionsData: Record<string, { q: string; o: string[]; a: number; exp: string }[]> = {
  upsc: [
    {
      q: "Which article of the Indian Constitution deals with the Amendment Procedure?",
      o: ["Article 356", "Article 360", "Article 368", "Article 370"],
      a: 2,
      exp: "Article 368 of Part XX of the Indian Constitution grants Parliament the power to amend the Constitution and its procedures.",
    },
    {
      q: "The concept of 'Federal System with Strong Center' in the Indian Constitution is borrowed from which country?",
      o: ["USA", "Canada", "Australia", "USSR"],
      a: 1,
      exp: "The federal scheme with a strong center is borrowed from the Canadian Constitution.",
    },
    {
      q: "Who was the first Chairman of the Planning Commission of India?",
      o: ["Dr. B.R. Ambedkar", "Jawaharlal Nehru", "Dr. Rajendra Prasad", "Sardar Patel"],
      a: 1,
      exp: "The Planning Commission was established in March 1950, and Prime Minister Jawaharlal Nehru was its first ex-officio chairman.",
    },
  ],
  ssc: [
    {
      q: "Which of the following is the highest peak in Southern India?",
      o: ["Anamudi", "Doddabetta", "Mahendragiri", "Kalsubai"],
      a: 0,
      exp: "Anamudi is located in Kerala and is the highest peak in the Western Ghats and South India, at an elevation of 2,695 meters.",
    },
    {
      q: "Which element is the most abundant in the Earth's crust by weight?",
      o: ["Silicon", "Oxygen", "Iron", "Aluminium"],
      a: 1,
      exp: "Oxygen makes up about 46.6% of the Earth's crust by weight, making it the most abundant element.",
    },
  ],
  default: [
    {
      q: "What is the primary function of the Reserve Bank of India (RBI)?",
      o: [
        "To accept deposits from individuals",
        "To regulate monetary policy and currency issuance",
        "To provide short-term personal loans",
        "To manage stock exchanges",
      ],
      a: 1,
      exp: "The RBI is India's central bank, responsible for regulating monetary policy, maintaining financial stability, and issuing banknotes.",
    },
    {
      q: "Which day is celebrated as national National Youth Day in India?",
      o: ["January 12", "January 26", "August 15", "October 2"],
      a: 0,
      exp: "National Youth Day is celebrated in India on January 12 to commemorate the birth anniversary of Swami Vivekananda.",
    },
  ],
};
